import React, {useState, useEffect} from 'react';
import {GoogleMap, LoadScript, DirectionsService} from '@react-google-maps/api';
import { ADDRESSES } from './constants';
const App = () => {
  // Initialize with today's date in YYYY-MM-DD format
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];

  // Initialize states
  const [tripDate, setTripDate] = useState(formattedDate);
  const [destination, setDestinationLocation] = useState('');
  const [distance, setDistance] = useState(null);
  const [tollInfo, setTollInfo] = useState(null);
  const [tripCount, setTripCount] = useState(1);
  
  // Initialize trips from localStorage
  const [trips, setTrips] = useState(() => {
    try {
      const savedTrips = localStorage.getItem('trips');
      return savedTrips ? JSON.parse(savedTrips) : [];
    } catch (error) {
      console.error('Error loading trips:', error);
      return [];
    }
  });

  // Save trips to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('trips', JSON.stringify(trips));
    } catch (error) {
      console.error('Error saving trips:', error);
    }
  }, [trips]);

  // Addresses and moving date
  const OLD_ADDRESS = ADDRESSES.OLD_ADDRESS;
  const NEW_ADDRESS = ADDRESSES.NEW_ADDRESS;
  const MOVING_DATE = new Date(ADDRESSES.MOVING_DATE); 
  
  const getHomeLocation = (date) => {
    return new Date(date) < MOVING_DATE ? OLD_ADDRESS : NEW_ADDRESS;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    calculateDistance();
  };

  const calculateDistance = () => {
    const homeLocation = getHomeLocation(tripDate);
    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: homeLocation,
        destination: destination,
        travelMode: 'DRIVING',
        unitSystem: window.google.maps.UnitSystem.IMPERIAL,
        avoidTolls: false
      },
      (response, status) => {
        if (status === 'OK') {
          const route = response.routes[0];
          const oneWayMiles = parseFloat(route.legs[0].distance.text);
          const roundTripMiles = oneWayMiles * 2;
          const hasTolls = route.legs[0].steps.some(step => 
            step.instructions.toLowerCase().includes('toll')
          );

          const newTrip = {
            id: Date.now(),
            date: tripDate,
            destination,
            oneWayMiles: oneWayMiles.toFixed(1),
            roundTripMiles: roundTripMiles.toFixed(1),
            count: parseInt(tripCount),
            totalMiles: (roundTripMiles * tripCount).toFixed(1),
            hasTolls
          };

          setTrips(prevTrips => [...prevTrips, newTrip]);
          setDestinationLocation('');
          setTripCount(1);
        } else {
          console.error('Error calculating route:', status);
        }
      }
    );
  };
  
  // Add filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);

  // Update filtered trips whenever trips or date filters change
  useEffect(() => {
    if (startDate && endDate) {
      const filtered = trips.filter(trip => {
        const tripDate = new Date(trip.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return tripDate >= start && tripDate <= end;
      });
      setFilteredTrips(filtered);
      setIsFiltering(true);
    } else {
      setFilteredTrips(trips);
      setIsFiltering(false);
    }
  }, [trips, startDate, endDate]);

  // Calculate total mileage for filtered trips
  const totalMileage = (isFiltering ? filteredTrips : trips)
    .reduce((sum, trip) => sum + (parseFloat(trip.roundTripMiles) * trip.count), 0)
    .toFixed(1);

  // Add clear filter function
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setIsFiltering(false);
  };

  // Update edit states
  const [editingId, setEditingId] = useState(null);
  const [editCount, setEditCount] = useState(1);
  const [editDate, setEditDate] = useState('');

  // Handle Edit Changes
  const handleEditSave = (id) => {
    const updatedTrips = trips.map(trip => {
      if (trip.id === id) {
        const updatedCount = parseInt(editCount);
        return {
          ...trip,
          date: editDate,
          count: updatedCount,
          totalMiles: (parseFloat(trip.roundTripMiles) * updatedCount).toFixed(1)
        };
      }
      return trip;
    });
    setTrips(updatedTrips);
    setEditingId(null);
    setEditCount(1);
    setEditDate('');
  };

  // Handle starting edit mode
  const startEditing = (trip) => {
    setEditingId(trip.id);
    setEditCount(trip.count);
    setEditDate(trip.date);
  };

  // Handle cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditCount(1);
    setEditDate('');
  };

  // Handle Count Change
  const handleCountChange = (id, newCount) => {
    const updatedTrips = trips.map(trip => {
      if (trip.id === id) {
        const updatedCount = parseInt(newCount);
        return {
          ...trip,
          count: updatedCount,
          totalMiles: (parseFloat(trip.roundTripMiles) * updatedCount).toFixed(1)
        };
      }
      return trip;
    });
    setTrips(updatedTrips);
    setEditingId(null);
  };

  // Delete Trip
  const deleteTrip = (id) => {
    const updatedTrips = trips.filter(trip => trip.id !== id);
    setTrips(updatedTrips);
  };
  
  // Update the date input handler
  const handleDateChange = (e) => {
    setTripDate(e.target.value);
  };

  // Add CSV export function
  const exportToCSV = () => {
    // Define CSV headers
    const headers = [
      'Date',
      'Destination',
      'Round Trip Miles',
      'Count',
      'Total Miles',
      'Tolls'
    ];

    // Get the trips to export (either filtered or all)
    const tripsToExport = isFiltering ? filteredTrips : trips;

    // Convert trips to CSV format
    const csvContent = [
      // Add headers
      headers.join(','),
      // Add trip data
      ...tripsToExport.map(trip => [
        trip.date,
        `"${trip.destination}"`, // Quote destination to handle commas
        trip.roundTripMiles,
        trip.count,
        trip.totalMiles,
        trip.hasTolls ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Set download attributes
    link.setAttribute('href', url);
    link.setAttribute('download', 
      isFiltering 
        ? `mileage_${startDate}_to_${endDate}.csv`
        : 'mileage_all_trips.csv'
    );
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h1>Mileage Tracker</h1>
      <h1>Calculate Trip Distance</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Trip Date:
          <input
            type="date"
            value={tripDate}
            onChange={handleDateChange}
          />
        </label>
        <br />
        <label>
          Destination:
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestinationLocation(e.target.value)}
            placeholder="Enter your destination"
          />
        </label>
        <br />
        <label>
          Number of Trips:
          <input
            type="number"
            min="1"
            value={tripCount}
            onChange={(e) => setTripCount(e.target.value)}
          />
        </label>
        <br />
        <button type="submit">Calculate Distance</button>
      </form>
      {distance && <p>Distance: {distance}</p>}
      {tollInfo && <p>{tollInfo}</p>}
      
      <div>
        <h2>Trip History</h2>
        
        {/* Add date range filter */}
        <div style={{ marginBottom: '20px' }}>
          <h3>Filter by Date Range</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label>
              Start Date:
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label>
              End Date:
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
            <button onClick={clearFilters}>Clear Filters</button>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px' 
        }}>
          <p>
            <strong>
              {isFiltering ? 'Filtered ' : 'Total '}
              Mileage: {totalMileage} miles
              {isFiltering && ` (${startDate} to ${endDate})`}
            </strong>
          </p>
          <button 
            onClick={exportToCSV}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Export to CSV
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Destination</th>
              <th>Round Trip Miles</th>
              <th>Count</th>
              <th>Total Miles</th>
              <th>Tolls</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(isFiltering ? filteredTrips : trips).map(trip => (
              <tr key={trip.id}>
                <td>
                  {editingId === trip.id ? (
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                    />
                  ) : (
                    trip.date
                  )}
                </td>
                <td>{trip.destination}</td>
                <td>{trip.roundTripMiles}</td>
                <td>
                  {editingId === trip.id ? (
                    <input
                      type="number"
                      min="1"
                      value={editCount}
                      onChange={(e) => setEditCount(e.target.value)}
                      style={{ width: '60px' }}
                    />
                  ) : (
                    trip.count
                  )}
                </td>
                <td>{trip.totalMiles}</td>
                <td>{trip.hasTolls ? 'Yes' : 'No'}</td>
                <td>
                  {editingId === trip.id ? (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button 
                        onClick={() => handleEditSave(trip.id)}
                        style={{ 
                          backgroundColor: '#4CAF50', 
                          color: 'white',
                          padding: '5px 10px',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        Save
                      </button>
                      <button 
                        onClick={cancelEdit}
                        style={{ 
                          backgroundColor: '#f44336', 
                          color: 'white',
                          padding: '5px 10px',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button 
                        onClick={() => startEditing(trip)}
                        style={{ 
                          backgroundColor: '#2196F3', 
                          color: 'white',
                          padding: '5px 10px',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => {
                          setTrips(prevTrips => 
                            prevTrips.filter(t => t.id !== trip.id)
                          );
                        }}
                        style={{ 
                          backgroundColor: '#f44336', 
                          color: 'white',
                          padding: '5px 10px',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function AppWrapper() {
  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <App />
    </LoadScript>
  )
}
