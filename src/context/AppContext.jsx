/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';

// Define context
const AppContext = createContext();

// Initial Settings
const initialSettings = {
  agencyName: "Aleef Concepts",
  currentMonth: new Date().toISOString().substring(0, 7), // YYYY-MM
  adminPasscode: "admin123"
};


const initialState = {
  clients: [],
  events: [],
  settings: {
    agencyName: "Aleef Concepts",
    currentMonth: new Date().toISOString().substring(0, 7),
    adminPasscode: "admin123"
  },
  activeNav: "dashboard",
  calendarFilterClient: null,
  toast: null
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_CLIENTS':
      return {
        ...state,
        clients: action.payload
      };

    case 'SET_EVENTS':
      return {
        ...state,
        events: action.payload
      };

    case 'SET_SETTINGS':
      return {
        ...state,
        settings: action.payload
      };

    case 'SET_NAV':
      return {
        ...state,
        activeNav: action.payload
      };

    case 'SET_CALENDAR_FILTER':
      return {
        ...state,
        calendarFilterClient: action.payload
      };
    
    case 'ADD_CLIENT':
      return {
        ...state,
        clients: [...state.clients, action.payload]
      };
      
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(client => 
          client.id === action.payload.id ? action.payload : client
        )
      };
      
    case 'DELETE_CLIENT':
      return {
        ...state,
        clients: state.clients.filter(client => client.id !== action.payload),
        // Clean up client references in events
        events: state.events.map(event => 
          event.client === action.payload ? { ...event, client: "" } : event
        )
      };
      
    case 'ADD_EVENT':
      return {
        ...state,
        events: [...state.events, action.payload]
      };
      
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(event => 
          event.id === action.payload.id ? action.payload : event
        )
      };
      
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload)
      };
      
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };
      
    case 'SHOW_TOAST':
      return {
        ...state,
        toast: action.payload // { message, type: "success" | "error" }
      };
      
    case 'CLEAR_TOAST':
      return {
        ...state,
        toast: null
      };

    case 'RESET_DATA':
      return {
        ...initialState,
        activeNav: state.activeNav
      };

    case 'CLEAR_DATA':
      return {
        clients: [],
        events: [],
        settings: {
          agencyName: "Agency",
          currentMonth: new Date().toISOString().substring(0, 7),
          adminPasscode: state.settings.adminPasscode || "admin123"
        },
        activeNav: "dashboard",
        toast: { message: "All data cleared", type: "success" }
      };
      
    default:
      return state;
  }
}

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Setup snapshot listeners and auto-seeding on mount
  useEffect(() => {
    const unsubscribeClients = onSnapshot(collection(db, "clients"), (snapshot) => {
      const clientsList = [];
      snapshot.forEach(docSnap => {
        clientsList.push({ id: docSnap.id, ...docSnap.data() });
      });
      dispatch({ type: 'SET_CLIENTS', payload: clientsList });
    });

    const unsubscribeEvents = onSnapshot(collection(db, "events"), (snapshot) => {
      const eventsList = [];
      snapshot.forEach(docSnap => {
        eventsList.push({ id: docSnap.id, ...docSnap.data() });
      });
      dispatch({ type: 'SET_EVENTS', payload: eventsList });
    });

    const unsubscribeSettings = onSnapshot(doc(db, "settings", "global"), (docSnap) => {
      if (docSnap.exists()) {
        dispatch({ type: 'SET_SETTINGS', payload: docSnap.data() });
      } else {
        // Initialize global settings doc if missing
        setDoc(doc(db, "settings", "global"), initialSettings);
      }
    });

    // Check and seed if global settings document is empty
    const checkAndSeed = async () => {
      try {
        const settingsSnap = await getDocs(collection(db, "settings"));
        if (settingsSnap.empty) {
          console.log("Global settings document is missing. Initializing settings...");
          await setDoc(doc(db, "settings", "global"), initialSettings);
        }
      } catch (err) {
        console.error("Error during Firestore settings check:", err);
      }
    };

    checkAndSeed();

    return () => {
      unsubscribeClients();
      unsubscribeEvents();
      unsubscribeSettings();
    };
  }, []);

  // Sync to database functions
  const seedFirestore = async () => {
    try {
      const batch = writeBatch(db);
      
      const clientsSnap = await getDocs(collection(db, "clients"));
      clientsSnap.forEach(d => {
        batch.delete(doc(db, "clients", d.id));
      });
      const eventsSnap = await getDocs(collection(db, "events"));
      eventsSnap.forEach(d => {
        batch.delete(doc(db, "events", d.id));
      });

      batch.set(doc(db, "settings", "global"), initialSettings);
      
      await batch.commit();
      showToast("All data cleared and settings reset ✓", "success");
    } catch (err) {
      console.error("Error resetting data in Firestore:", err);
      showToast("Failed to reset data", "error");
    }
  };

  const clearFirestore = async () => {
    try {
      const batch = writeBatch(db);
      
      const clientsSnap = await getDocs(collection(db, "clients"));
      clientsSnap.forEach(d => {
        batch.delete(doc(db, "clients", d.id));
      });
      const eventsSnap = await getDocs(collection(db, "events"));
      eventsSnap.forEach(d => {
        batch.delete(doc(db, "events", d.id));
      });

      const defaultSettings = {
        agencyName: "Agency",
        currentMonth: new Date().toISOString().substring(0, 7),
        adminPasscode: state.settings?.adminPasscode || "admin123"
      };
      batch.set(doc(db, "settings", "global"), defaultSettings);
      
      await batch.commit();
      showToast("All data cleared from Firestore ✓", "success");
    } catch (err) {
      console.error("Error clearing data in Firestore:", err);
      showToast("Failed to clear data", "error");
    }
  };

  // Intercepting dispatch to write to Firestore
  const customDispatch = async (action) => {
    switch (action.type) {
      case 'ADD_CLIENT':
      case 'UPDATE_CLIENT': {
        const client = action.payload;
        await setDoc(doc(db, "clients", client.id), client);
        break;
      }
      case 'DELETE_CLIENT': {
        const clientId = action.payload;
        await deleteDoc(doc(db, "clients", clientId));
        const affectedEvents = state.events.filter(e => e.client === clientId);
        const batch = writeBatch(db);
        affectedEvents.forEach(ev => {
          batch.update(doc(db, "events", ev.id), { client: "" });
        });
        await batch.commit();
        break;
      }
      case 'ADD_EVENT':
      case 'UPDATE_EVENT': {
        const event = action.payload;
        await setDoc(doc(db, "events", event.id), event);
        break;
      }
      case 'DELETE_EVENT': {
        const eventId = action.payload;
        await deleteDoc(doc(db, "events", eventId));
        break;
      }
      case 'UPDATE_SETTINGS': {
        const settings = {
          ...state.settings,
          ...action.payload
        };
        await setDoc(doc(db, "settings", "global"), settings);
        break;
      }
      case 'RESET_DATA': {
        await seedFirestore();
        break;
      }
      case 'CLEAR_DATA': {
        await clearFirestore();
        break;
      }
      default:
        dispatch(action);
    }
  };

  // Convenience helper for dispatching toast notifications
  const showToast = (message, type = "success") => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
  };

  return (
    <AppContext.Provider value={{ state, dispatch: customDispatch, showToast }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
