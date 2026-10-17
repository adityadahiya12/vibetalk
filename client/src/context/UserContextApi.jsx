import { createContext, useContext, useEffect, useState } from "react";

// Create the context
const UserContext = createContext();

const getInitialUser = () => {
    try {
        const storedUser = localStorage.getItem("userData");
        return storedUser ? JSON.parse(storedUser) : null;
    } catch {
        return null;
    }
};

// Provider component to wrap around your app
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(getInitialUser);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem("userData");
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error("Error reading stored user:", e);
        }
    }, []);

    // Function to update user data
    const updateUser = (newUserData) => {
        setUser(newUserData);
        if (newUserData) {
            localStorage.setItem("userData", JSON.stringify(newUserData));
        } else {
            localStorage.removeItem("userData");
        }
    };

    return (
        <UserContext.Provider value={{ user, updateUser, loading, setLoading }}>
            {children}
        </UserContext.Provider>
    );
};

// Custom hook for consuming the context
// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
