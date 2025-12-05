# Protego Frontend

React + Vite frontend for Protego Personal Safety Companion.

## Development

### Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Visit http://localhost:5173

### Building for Production

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## Project Structure

```
frontend/
├── src/
│   ├── main.jsx           # Application entry point
│   ├── App.jsx            # Root component with routing
│   ├── index.css          # Global styles & Tailwind
│   ├── pages/             # Page components
│   │   ├── Register.jsx   # User registration
│   │   ├── Home.jsx       # Main dashboard
│   │   ├── Alerts.jsx     # Alert history
│   │   ├── Settings.jsx   # User settings
│   │   └── Admin.jsx      # Admin dashboard
│   ├── components/        # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── AlertCard.jsx
│   │   ├── CountdownAlert.jsx
│   │   └── QuickStats.jsx
│   ├── services/          # API integration
│   │   └── api.js         # Axios API client
│   ├── store/             # State management
│   │   └── useUserStore.js # Zustand stores
│   └── tests/             # Test files
│       └── AlertCard.test.jsx
├── public/                # Static assets
├── index.html            # HTML template
├── package.json          # Dependencies
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
└── postcss.config.js     # PostCSS configuration
```

## Key Features

### Pages

- **Register**: User registration with trusted contacts
- **Home**: Walk mode control and quick stats
- **Alerts**: Alert history with filtering
- **Settings**: Profile and contact management
- **Admin**: System-wide monitoring dashboard

### Components

- **Navbar**: Navigation with walk mode indicator
- **AlertCard**: Display alert details with status badges
- **CountdownAlert**: Modal for alert countdown/cancellation
- **QuickStats**: User statistics dashboard

### State Management

Using Zustand for global state:
- User authentication
- Active walk session
- Pending alerts
- Recent alerts

### API Integration

All API calls are centralized in `services/api.js`:
- User management
- Walk sessions
- Alerts
- Admin endpoints

## Styling

Using Tailwind CSS with custom utilities:

```jsx
// Button variants
<button className="btn-primary">Primary</button>
<button className="btn-secondary">Secondary</button>
<button className="btn-danger">Danger</button>
<button className="btn-success">Success</button>

// Badges
<span className="badge-success">Success</span>
<span className="badge-danger">Danger</span>
<span className="badge-warning">Warning</span>

// Cards
<div className="card">Content</div>

// Form inputs
<input className="input-field" />
```

## Environment Variables

Create `.env.local`:

```env
VITE_API_URL=http://localhost:8000
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Performance

- Code splitting with React.lazy()
- Optimized bundle size with Vite
- Lazy loading for images
- Debounced API calls

## Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support
