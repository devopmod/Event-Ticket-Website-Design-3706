# Components Structure

## Current Structure:
```
src/components/
├── admin/                    # Admin panel components
├── common/                   # Shared components (SafeIcon, ProtectedRoute, etc.)
├── layout/NavBar/           # Main navigation component
├── CalendarModal.jsx        # Calendar popup
├── CalendarSection.jsx      # Calendar with events
├── EventCard.jsx           # Event card component
├── EventCardList.jsx       # List of event cards
├── EventGrid.jsx           # Grid layout for events
├── EventGridCard.jsx       # Card for grid layout
├── EventSection.jsx        # Section with events
├── FilterPanel.jsx         # Filters for events
├── Footer.jsx              # Footer component
├── HeroSection.jsx         # Hero section on homepage
├── Pagination.jsx          # Pagination component
├── SearchBar.jsx           # Search functionality
├── SeatMap.jsx             # Seat map component
└── VenueSeatingChart.jsx   # Venue seating chart
```

## Notes:
- `Navbar.jsx` was removed as duplicate of `layout/NavBar/index.jsx`
- All components are actively used in the application
- Admin components are properly separated in `admin/` folder
- Common utilities are in `common/` folder