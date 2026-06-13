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

// Seed data
const initialSettings = {
  agencyName: "Aleef Concepts",
  currentMonth: "2025-06" // YYYY-MM
};

const seedClients = [
  {
    id: "c1",
    name: "Zara Home MENA",
    niche: "Fashion",
    manager: "Sara K",
    color: "#00E5A0",
    notes: "Seasonal campaign ongoing",
    deliverables: [
      { id: "d1-1", title: "4 Reels Production", status: "delivered", contentType: "Reel" },
      { id: "d1-2", title: "8 Static Grid Posts", status: "delivered", contentType: "Poster" },
      { id: "d1-3", title: "TikTok Trends Research", status: "delivered", contentType: "General" },
      { id: "d1-4", title: "Newsletter Copywriting", status: "delivered", contentType: "General" },
      { id: "d1-5", title: "Paid Ads Assets Set A", status: "delivered", contentType: "Poster" },
      { id: "d1-6", title: "SEO Keyword Audit", status: "delivered", contentType: "General" },
      { id: "d1-7", title: "Monthly Campaign Budget", status: "delivered", contentType: "General" },
      { id: "d1-8", title: "Product Grid Layout Design", status: "delivered", contentType: "Carousel" },
      { id: "d1-9", title: "Influencer Outreach Planning", status: "pending", contentType: "General" },
      { id: "d1-10", title: "PR Press Release Distribution", status: "pending", contentType: "General" },
      { id: "d1-11", title: "Competitor Visual Audit Report", status: "pending", contentType: "Carousel" },
      { id: "d1-12", title: "Q3 Strategy Presentation", status: "overdue", contentType: "General" }
    ]
  },
  {
    id: "c2",
    name: "BrewLab Coffee",
    niche: "F&B",
    manager: "Omar R",
    color: "#F59E0B",
    notes: "Cafe launch strategy & influencer invites",
    deliverables: [
      { id: "d2-1", title: "Brand Identity Design", status: "delivered", contentType: "General" },
      { id: "d2-2", title: "Packaging Box Layout", status: "delivered", contentType: "Poster" },
      { id: "d2-3", title: "Coffee Bag Labels", status: "delivered", contentType: "Poster" },
      { id: "d2-4", title: "Menu Board Design", status: "delivered", contentType: "Poster" },
      { id: "d2-5", title: "Grand Opening PR Pitch", status: "delivered", contentType: "General" },
      { id: "d2-6", title: "Instagram Launch Reels", status: "delivered", contentType: "Reel" },
      { id: "d2-7", title: "Local F&B Influencer List", status: "delivered", contentType: "General" },
      { id: "d2-8", title: "Website Landing Page Draft", status: "delivered", contentType: "General" }
    ]
  },
  {
    id: "c3",
    name: "NexGen SaaS",
    niche: "Tech",
    manager: "Lena M",
    color: "#6EE7B7",
    notes: "Product Hunt launch items",
    deliverables: [
      { id: "d3-1", title: "Product Hunt Asset Kit", status: "delivered", contentType: "General" },
      { id: "d3-2", title: "Landing Page Copywriting", status: "delivered", contentType: "General" },
      { id: "d3-3", title: "Launch Day Email Flow", status: "delivered", contentType: "General" },
      { id: "d3-4", title: "Social Media Banner Suite", status: "delivered", contentType: "Poster" },
      { id: "d3-5", title: "Pitch Video Subtitles & Edit", status: "in-progress", contentType: "Reel" },
      { id: "d3-6", title: "Twitter Launch Thread Draft", status: "in-progress", contentType: "General" },
      { id: "d3-7", title: "Paid LinkedIn Ad Launch", status: "in-progress", contentType: "General" },
      { id: "d3-8", title: "Founder Post Ghostwriting", status: "in-progress", contentType: "General" },
      { id: "d3-9", title: "QA Testing Log Check", status: "pending", contentType: "General" },
      { id: "d3-10", title: "Beta User Feedback Form", status: "pending", contentType: "General" }
    ]
  }
];

const seedEvents = [
  { id: "e1", title: "Zara Campaign Pitch", date: "2025-06-05", client: "c1", color: "#EF4444", contentType: "Reel", status: "delivered" },
  { id: "e2", title: "BrewLab Cafe Launch", date: "2025-06-15", client: "c2", color: "#3B82F6", contentType: "Poster", status: "delivered" },
  { id: "e3", title: "NexGen Product Hunt", date: "2025-06-20", client: "c3", color: "#10B981", contentType: "Carousel", status: "pending" },
  { id: "e4", title: "Monthly Progress Review", date: "2025-06-30", client: "", color: "#00E5A0", contentType: "General", status: "in-progress" },
  
  // Also add duplicate events for June 2026 so that today's view displays beautifully
  { id: "e5", title: "Zara Campaign Pitch", date: "2026-06-05", client: "c1", color: "#EF4444", contentType: "Reel", status: "delivered" },
  { id: "e6", title: "BrewLab Cafe Launch", date: "2026-06-15", client: "c2", color: "#3B82F6", contentType: "Poster", status: "delivered" },
  { id: "e7", title: "NexGen Product Hunt", date: "2026-06-20", client: "c3", color: "#10B981", contentType: "Carousel", status: "in-progress" },
  { id: "e8", title: "Monthly Progress Review", date: "2026-06-30", client: "", color: "#00E5A0", contentType: "General", status: "pending" },

  // Custom content type events
  { id: "e9", title: "Zara TikTok Brand Video", date: "2025-06-10", client: "c1", color: "#EC4899", contentType: "TikTok", status: "delivered" },
  { id: "e10", title: "BrewLab Weekly Newsletter", date: "2025-06-18", client: "c2", color: "#8B5CF6", contentType: "Newsletter", status: "delivered" },
  { id: "e11", title: "Zara TikTok Brand Video", date: "2026-06-10", client: "c1", color: "#EC4899", contentType: "TikTok", status: "delivered" },
  { id: "e12", title: "BrewLab Weekly Newsletter", date: "2026-06-18", client: "c2", color: "#8B5CF6", contentType: "Newsletter", status: "delivered" }
];


const initialState = {
  clients: [],
  events: [],
  settings: {
    agencyName: "Aleef Concepts",
    currentMonth: new Date().toISOString().substring(0, 7)
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
          currentMonth: new Date().toISOString().substring(0, 7)
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

    // Check and seed if Firestore collections are empty
    const checkAndSeed = async () => {
      try {
        const clientsSnap = await getDocs(collection(db, "clients"));
        const eventsSnap = await getDocs(collection(db, "events"));
        
        if (clientsSnap.empty && eventsSnap.empty) {
          console.log("Firestore collections are empty. Seeding database with demo data...");
          const batch = writeBatch(db);
          
          seedClients.forEach(client => {
            batch.set(doc(db, "clients", client.id), client);
          });
          seedEvents.forEach(event => {
            batch.set(doc(db, "events", event.id), event);
          });
          batch.set(doc(db, "settings", "global"), initialSettings);
          
          await batch.commit();
        }
      } catch (err) {
        console.error("Error during Firestore seeding check:", err);
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

      seedClients.forEach(client => {
        batch.set(doc(db, "clients", client.id), client);
      });
      seedEvents.forEach(event => {
        batch.set(doc(db, "events", event.id), event);
      });
      batch.set(doc(db, "settings", "global"), initialSettings);
      
      await batch.commit();
      showToast("Data reset to demo clients ✓", "success");
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
        currentMonth: new Date().toISOString().substring(0, 7)
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
