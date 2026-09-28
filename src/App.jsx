import { useState } from "react";
import BookPage from "./components/BookPage";
import AuthPage from "./components/AuthPage";

function App() {

    const [token, setToken] = useState(
        localStorage.getItem("token")
    );

    const handleLogin = (newToken) => {
        localStorage.setItem("token", newToken);
        setToken(newToken);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setToken(null);
    };

    return (
        <>
            {token ? (
                <BookPage onLogout={handleLogout} />
            ) : (
                <AuthPage onLogin={handleLogin} />
            )}
        </>
    );
}

export default App;