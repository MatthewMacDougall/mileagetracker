# Mileage Tracker

A simple mileage tracker built with React using Google Maps API.

## Features
- Automatic distance calculation between two addresses using Google Maps API.
- Round-trip mileage calculation.
- Multiple trip counting for recurring routes.
- Automatic toll detection along the route.
- Date-based home address selection (before and after a moving date).
- Date range filtering for trip history.
- CSV export functionality.
- Local storage persistence.
- Edit and delete trip functionality.
    - Trip count editing
    - Date editing.

## Technologies Used
- React
- Google Maps API
- Local Storage

## Setup
1. Clone the repository.
2. Create a `.env` file in the root directory and add the following:
    - `REACT_APP_GOOGLE_MAPS_API_KEY`
    - `REACT_APP_OLD_ADDRESS`
    - `REACT_APP_NEW_ADDRESS`
    - `REACT_APP_MOVING_DATE` (YYYY-MM-DD)
3. Run `npm install` to install the dependencies.
4. Run `npm start` to start the development server.

## Environment Variables
The following environment variables are required:
- `REACT_APP_GOOGLE_MAPS_API_KEY`: Your Google Maps API key

## Data Storage
All trip data is stored in the browser's localStorage.

## Exporting Data
Data can be exported to a CSV file.

## Moving Date
Note that I moved during the course of the year, so the mileage before 
and after the moving date is calculated separately. If not applicable, 
use the same address for both OLD_ADDRESS and NEW_ADDRESS for same functionality.