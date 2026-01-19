// js/state.js

const StateManager = {
    // The keys for our data in localStorage.
    keys: {
        students: 'hms_students',
        rooms: 'hms_rooms',
        complaints: 'hms_complaints',
        announcements: 'hms_announcements',
        fees: 'hms_fees',
        messMenu: 'hms_messMenu' // NEW KEY
    },

    /**
     * Initializes the database with sample data if it's empty.
     * This runs once when the application starts.
     */
    initialize: function() {
        const initData = (key, sampleData) => {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify(sampleData));
            }
        };

        // --- Existing Data Initialization (no changes) ---
        const sampleStudents = [ { id: 'STU001', name: 'Alia Khan', room: '101' }, /* ... */ ];
        initData(this.keys.students, sampleStudents);

        const sampleRooms = [ { id: '101', capacity: 2, status: 'occupied' }, /* ... */ ];
        initData(this.keys.rooms, sampleRooms);

        const sampleComplaints = [ { complaintId: 1, studentId: 'STU002', issue: 'Wi-Fi not working...', status: 'pending', date: new Date().toISOString() } ];
        initData(this.keys.complaints, sampleComplaints);

        const sampleAnnouncements = [ { id: Date.now(), text: 'Welcome! Please report any maintenance issues via the portal.', date: new Date().toISOString() } ];
        initData(this.keys.announcements, sampleAnnouncements);

        const sampleFees = [ { feeId: 'FEE_1725129000000', studentId: 'STU001', month: '2025-09', amount: 5000, status: 'paid', dueDate: '2025-09-10' }, /* ... */ ];
        initData(this.keys.fees, sampleFees);

        // === NEW MESS MENU DATA INITIALIZATION ===
        const sampleMenu = {
            // Using day index (0=Sunday, 1=Monday, etc.) for easy lookup.
            '0': { day: 'Sunday', breakfast: 'Aloo Puri, Curd', lunch: 'Rajma, Rice, Roti', dinner: 'Special Dinner: Paneer Butter Masala, Naan, Gulab Jamun' },
            '1': { day: 'Monday', breakfast: 'Idli, Sambar', lunch: 'Dal Makhani, Rice, Roti', dinner: 'Mix Veg, Roti' },
            '2': { day: 'Tuesday', breakfast: 'Poha, Jalebi', lunch: 'Chole, Rice, Roti', dinner: 'Kadhi Pakoda, Rice' },
            '3': { day: 'Wednesday', breakfast: 'Paratha, Pickle', lunch: 'Seasonal Veg, Dal, Roti', dinner: 'Egg Curry, Rice' },
            '4': { day: 'Thursday', breakfast: 'Dosa, Chutney', lunch: 'Dal Fry, Jeera Rice, Roti', dinner: 'Aloo Gobi, Roti' },
            '5': { day: 'Friday', breakfast: 'Upma', lunch: 'Black Chana, Rice, Roti', dinner: 'Lauki Sabzi, Roti' },
            '6': { day: 'Saturday', breakfast: 'Bread, Omelette', lunch: 'Sambar, Rice, Papad', dinner: 'Khichdi, Curd' }
        };
        initData(this.keys.messMenu, sampleMenu);
        // === END OF NEW MESS MENU DATA ===
    },

    /**
     * A generic getter to retrieve data from localStorage.
     * @param {string} key - The key of the data to retrieve.
     * @returns {Array|Object} - The parsed data or a default value.
     */
    get: function(key) {
        try {
            const data = localStorage.getItem(key);
            // Return empty object for menu if it doesn't exist, otherwise empty array.
            const defaultValue = key === this.keys.messMenu ? {} : [];
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Error parsing data for key: ${key}`, error);
            const defaultValue = key === this.keys.messMenu ? {} : [];
            return defaultValue;
        }
    },

    /**
     * A generic setter to save data to localStorage.
     * @param {string} key - The key under which to save the data.
     * @param {Array|Object} data - The data to save.
     */
    save: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Error saving data for key: ${key}`, error);
        }
    },

    /**
     * Retrieves all application data in one object.
     * @returns {Object} An object containing all major data arrays and objects.
     */
    getAllData: function() {
        return {
            students: this.get(this.keys.students),
            rooms: this.get(this.keys.rooms),
            complaints: this.get(this.keys.complaints),
            announcements: this.get(this.keys.announcements),
            fees: this.get(this.keys.fees),
            messMenu: this.get(this.keys.messMenu) // NEW
        };
    },

    /**
     * Overwrites all application data. Used for importing backups.
     * @param {Object} allData - An object containing students, rooms, etc.
     */
    importAllData: function(allData) {
        if (allData.students) this.save(this.keys.students, allData.students);
        if (allData.rooms) this.save(this.keys.rooms, allData.rooms);
        if (allData.complaints) this.save(this.keys.complaints, allData.complaints);
        if (allData.announcements) this.save(this.keys.announcements, allData.announcements);
        if (allData.fees) this.save(this.keys.fees, allData.fees);
        if (allData.messMenu) this.save(this.keys.messMenu, allData.messMenu); // NEW
    },

    // --- Specific Data Handlers (addStudent, addAnnouncement) remain unchanged ---
};

// Initialize the state when the script loads.
StateManager.initialize();