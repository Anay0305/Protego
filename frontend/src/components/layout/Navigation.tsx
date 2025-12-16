interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const views = ['dashboard', 'tracking', 'contacts', 'safety'];

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-1.5 sm:p-2 flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-hide">
      {views.map((view) => (
        <button
          key={view}
          onClick={() => onViewChange(view)}
          className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium whitespace-nowrap transition active:scale-95 text-sm sm:text-base ${
            currentView === view
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {view.charAt(0).toUpperCase() + view.slice(1)}
        </button>
      ))}
    </div>
  );
}
