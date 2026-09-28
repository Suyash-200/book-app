import axios from "axios";
import { useState } from "react";

const AuthPage = ({ onLogin }) => {

    const apiUrl = "http://localhost:3000/api/users";

    const [isLogin, setIsLogin] = useState(false);
    const [passwordShow, setPasswordShow] = useState(false)

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });

    const [loginFormData, setLoginFormData] = useState({
        username: "",
        password: "",
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleLoginChange = (e) => {
        setLoginFormData({
            ...loginFormData,
            [e.target.name]: e.target.value,
        });
    };

    // ================= REGISTER =================

    const handleRegister = async (e) => {
        e.preventDefault();

        try {

            const response = await axios.post(
                `${apiUrl}/register`,
                {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                }
            );

            alert(
                response.data.message ||
                "Registration successful. Please login."
            );

            // Go to login
            setIsLogin(true);

            // Clear form
            setFormData({
                username: "",
                email: "",
                password: ""
            });

        } catch (error) {

            alert(
                error.response?.data?.message ||
                "Registration failed"
            );
        }
    };

    // ================= LOGIN =================

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(
                `${apiUrl}/login`,
                {
                    username: loginFormData.username,
                    password: loginFormData.password
                }
            );

            const token = response.data;

            localStorage.setItem("token", token);

            onLogin(token);

        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Login failed"
            );
        }
    };

    const handleShowPassword = () => {
        setPasswordShow((prev) => !prev);
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">

            <div className="w-full max-w-md">

                <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">

                    {/* HEADER */}

                    <div className="text-center mb-7">

                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 text-white text-xl font-bold">
                            B
                        </div>

                        <h1 className="text-2xl font-bold text-slate-800">
                            {isLogin
                                ? "Welcome Back"
                                : "Create Account"
                            }
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            {isLogin
                                ? "Login to continue to your account"
                                : "Register to create your new account"
                            }
                        </p>

                    </div>

                    {/* LOGIN / REGISTER SWITCH */}

                    <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">

                        <button
                            type="button"
                            onClick={() => setIsLogin(true)}
                            className={`rounded-md py-2 text-sm font-medium transition ${isLogin
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-500"
                                }`}
                        >
                            Login
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsLogin(false)}
                            className={`rounded-md py-2 text-sm font-medium transition ${!isLogin
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-500"
                                }`}
                        >
                            Register
                        </button>

                    </div>

                    {/* FORM */}

                    <form
                        onSubmit={
                            isLogin
                                ? handleLogin
                                : handleRegister
                        }
                        className="space-y-5"
                    >

                        {/* USERNAME */}

                        <div>

                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Username
                            </label>

                            <input
                                type="text"
                                name="username"
                                value={!isLogin ? formData.username : loginFormData.username}
                                onChange={!isLogin ? handleChange : handleLoginChange}
                                placeholder="Enter username"
                                required
                                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />

                        </div>

                        {/* EMAIL - REGISTER ONLY */}

                        {!isLogin && (
                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter email"
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />

                            </div>
                        )}

                        {/* PASSWORD */}

                        <div>

                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Password
                            </label>

                            <div className="relative">

                                <input
                                    type={passwordShow ? 'text' : 'password'}
                                    name="password"
                                    value={!isLogin ? formData.password : loginFormData.password}
                                    onChange={!isLogin ? handleChange : handleLoginChange}
                                    placeholder="Enter password"
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-11 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />

                                <button
                                    type="button"
                                    onClick={handleShowPassword}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {passwordShow ? (
                                        // Eye-off icon (currently showing password)
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="1.8"
                                                d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                                            />
                                        </svg>
                                    ) : (
                                        // Eye icon (password hidden)
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="1.8"
                                                d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="1.8"
                                                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                            />
                                        </svg>
                                    )}
                                </button>

                            </div>

                        </div>

                        {/* SUBMIT */}

                        <button
                            type="submit"
                            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                            {isLogin
                                ? "Login"
                                : "Create Account"
                            }
                        </button>

                    </form>

                    {/* BOTTOM */}

                    <div className="mt-6 text-center text-sm text-slate-500">

                        {isLogin ? (
                            <>
                                Don't have an account?{" "}

                                <button
                                    type="button"
                                    onClick={() => setIsLogin(false)}
                                    className="font-semibold text-indigo-600"
                                >
                                    Register
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{" "}

                                <button
                                    type="button"
                                    onClick={() => setIsLogin(true)}
                                    className="font-semibold text-indigo-600"
                                >
                                    Login
                                </button>
                            </>
                        )}

                    </div>

                </div>

                <p className="mt-5 text-center text-xs text-slate-400">
                    © 2026 Book Management System
                </p>

            </div>

        </div>
    );
};

export default AuthPage;