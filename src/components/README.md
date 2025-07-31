# Components Structure

## Current Structure:
```
src/components/
├── admin/                    # Admin panel components
│   ├── AdminNavBar/         # Admin navigation
│   ├── EventDashboard/      # Event management dashboard
│   ├── EventWizard/         # Event creation wizard
│   ├── VenueDesigner/       # Venue layout designer
│   ├── VenueVerificationBadge.jsx
│   └── VenueVerificationModal.jsx
├── common/                  # Shared components
│   ├── LanguageSelector.jsx
│   ├── ProtectedRoute.jsx
│   └── SafeIcon.jsx
├── layout/                  # Layout components
│   └── NavBar/             # Main navigation
├── CalendarModal.jsx       # Calendar popup
├── CalendarSection.jsx     # Calendar with events
├── EventCard.jsx          # Event card component
├── EventCardList.jsx      # List of event cards
├── EventGrid.jsx          # Grid layout for events
├── EventGridCard.jsx      # Card for grid layout
├── EventSection.jsx       # Section with events
├── FilterPanel.jsx        # Filters for events
├── Footer.jsx             # Footer component
├── HeroSection.jsx        # Hero section on homepage
├── Pagination.jsx         # Pagination component
├── SearchBar.jsx          # Search functionality
├── SeatMap.jsx            # Seat map component
└── VenueSeatingChart.jsx  # Venue seating chart
```

## Notes:
- All components are actively used in the application
- Admin components are properly separated in `admin/` folder
- Common utilities are in `common/` folder
- Layout components are in `layout/` folder