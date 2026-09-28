import axios from "axios";
import { useEffect, useRef, useState } from "react";

const BookPage = ({ onLogout }) => {
    const apiUrl = "http://localhost:3000/api/books";

    const [getBook, setGetBook] = useState([]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [getSingleBook, setGetSingleBook] = useState(null);

    const [editBookId, setEditBookId] = useState(null);

    const [addBook, setAddBook] = useState({
        title: "",
        author: "",
        description: "",
        category: "",
        price: "",
        publishedYear: "",
    });

    // Raw input value (updates instantly for a responsive input box)
    const [search, setSearch] = useState("");
    // Debounced value that actually triggers the API call
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [category, setCategory] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(3);
    const [totalPages, setTotalPages] = useState(0);
    const [totalBooks, setTotalBooks] = useState(0);

    // Tracks the most recent request so late-arriving (stale) responses
    // can be ignored instead of overwriting newer state.
    const requestIdRef = useRef(0);

    // =========================
    // Handle Input Change
    // =========================
    const handleChange = (e) => {
        const { name, value } = e.target;

        setAddBook((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // =========================
    // Debounce search input
    // =========================
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    // =========================
    // Fetch All Books
    // =========================
    useEffect(() => {
        fetchAllBook();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, debouncedSearch, category]);

    useEffect(() => {
        if (totalPages > 0 && page > totalPages) {
            setPage(totalPages);
        }
    }, [totalPages, page]);

    const fetchAllBook = async () => {
        const currentRequestId = ++requestIdRef.current;

        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(apiUrl, {
                params: {
                    search: debouncedSearch,
                    category,
                    page,
                    limit,
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Ignore this response if a newer request has since been fired
            if (currentRequestId !== requestIdRef.current) return;

            setGetBook(response.data.docs);
            setTotalPages(response.data.totalPages);
            setTotalBooks(response.data.totalDocs);
        } catch (error) {
            if (currentRequestId !== requestIdRef.current) return;

            console.error("Error fetching books:", error);

            if (error.response?.status === 401 || error.response?.status === 403) {
                onLogout();
            }
        }
    };

    // =========================
    // ADD BOOK
    // =========================
    const openAddModal = () => {
        setAddBook({
            title: "",
            author: "",
            description: "",
            category: "",
            price: "",
            publishedYear: "",
        });

        setIsAddModalOpen(true);
    };

    const closeAddModal = () => {
        setIsAddModalOpen(false);
    };

    const handleAddBook = async (e) => {
        e.preventDefault();

        try {
            await axios.post(apiUrl, addBook, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            setAddBook({
                title: "",
                author: "",
                description: "",
                category: "",
                price: "",
                publishedYear: "",
            });

            setIsAddModalOpen(false);

            fetchAllBook();
        } catch (error) {
            console.error("Error adding book:", error);
        }
    };

    // =========================
    // VIEW BOOK
    // =========================
    const openViewModal = async (id) => {
        try {
            const res = await axios.get(`${apiUrl}/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            setGetSingleBook(res.data);

            setIsViewModalOpen(true);
        } catch (error) {
            console.error("Error fetching single book:", error);
        }
    };

    const closeViewModal = () => {
        setIsViewModalOpen(false);
        setGetSingleBook(null);
    };

    // =========================
    // EDIT BOOK
    // =========================
    const openEditModal = async (id) => {
        try {
            const res = await axios.get(`${apiUrl}/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const book = res.data;

            setEditBookId(id);

            setAddBook({
                title: book.title || "",
                author: book.author || "",
                description: book.description || "",
                category: book.category || "",
                price: book.price || "",
                publishedYear: book.publishedYear || "",
            });

            setIsEditModalOpen(true);
        } catch (error) {
            console.error("Error fetching book for edit:", error);
        }
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditBookId(null);

        setAddBook({
            title: "",
            author: "",
            description: "",
            category: "",
            price: "",
            publishedYear: "",
        });
    };

    // =========================
    // UPDATE BOOK
    // =========================
    const handleEditBook = async (e) => {
        e.preventDefault();

        try {
            await axios.put(`${apiUrl}/${editBookId}`, addBook, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            setIsEditModalOpen(false);
            setEditBookId(null);

            setAddBook({
                title: "",
                author: "",
                description: "",
                category: "",
                price: "",
                publishedYear: "",
            });

            fetchAllBook();
        } catch (error) {
            console.error("Error updating book:", error);
        }
    };

    // =========================
    // DELETE BOOK
    // =========================
    const handleDeleteBook = async (id) => {
        try {
            await axios.delete(`${apiUrl}/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            fetchAllBook();
        } catch (error) {
            console.error("Error deleting book:", error);
        }
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
    };

    const handleCategoryChange = (e) => {
        setCategory(e.target.value);
        setPage(1);
    };

    // =========================
    // Windowed page numbers (max 5 visible, with first/last + ellipsis)
    // =========================
    const getVisiblePageNumbers = () => {
        const windowSize = 5;
        const pages = [];

        if (totalPages <= windowSize + 2) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }

        let start = Math.max(2, page - 2);
        let end = Math.min(totalPages - 1, page + 2);

        if (page <= 3) {
            start = 2;
            end = windowSize;
        } else if (page >= totalPages - 2) {
            start = totalPages - windowSize + 1;
            end = totalPages - 1;
        }

        pages.push(1);
        if (start > 2) pages.push("ellipsis-start");
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < totalPages - 1) pages.push("ellipsis-end");
        pages.push(totalPages);

        return pages;
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

            {/* ================= HEADER ================= */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Book Management
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Manage your books and book information
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={openAddModal}
                        type="button"
                        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                        + Add Book
                    </button>

                    <button
                        onClick={onLogout}
                        type="button"
                        className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                        Logout
                    </button>
                </div>

            </div>

            {/* ================= SEARCH ================= */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row">

                <div className="relative flex-1">

                    <svg
                        className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
                        />
                    </svg>

                    <input
                        type="text"
                        value={search}
                        onChange={handleSearchChange}
                        placeholder="Search books..."
                        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                </div>

                <select
                    value={category}
                    onChange={handleCategoryChange}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-56"
                >
                    <option value="">All Categories</option>
                    <option value="Fiction">Fiction</option>
                    <option value="Programming">Programming</option>
                    <option value="Self Help">Self Help</option>
                    <option value="Biography">Biography</option>
                </select>

            </div>

            {/* ================= TABLE ================= */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[900px] text-left">

                        <thead className="border-b border-slate-200 bg-slate-50">

                            <tr>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    #
                                </th>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Book
                                </th>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Author
                                </th>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Category
                                </th>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Published
                                </th>

                                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Price
                                </th>

                                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody className="divide-y divide-slate-100">

                            {getBook.length > 0 ? (
                                getBook.map((book, index) => (

                                    <tr
                                        key={book._id}
                                        className="transition hover:bg-slate-50"
                                    >

                                        <td className="px-5 py-4 text-sm text-slate-500">
                                            {(page - 1) * limit + index + 1}
                                        </td>

                                        <td className="px-5 py-4 w-[400px]">

                                            <div className="flex items-center gap-3">

                                                <div className="flex h-11 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
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
                                                            d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"
                                                        />
                                                    </svg>
                                                </div>

                                                <div>
                                                    <p className="font-semibold text-slate-800">
                                                        {book.title}
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-slate-400">
                                                        {book.description}
                                                    </p>
                                                </div>

                                            </div>

                                        </td>

                                        <td className="px-5 py-4 text-sm text-slate-600">
                                            {book.author}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                                                {book.category}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-sm text-slate-600">
                                            {book.publishedYear}
                                        </td>

                                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                                            {book.price}
                                        </td>

                                        <td className="px-5 py-4">

                                            <div className="flex justify-center gap-2">

                                                {/* VIEW */}
                                                <button
                                                    onClick={() => openViewModal(book._id)}
                                                    type="button"
                                                    className="rounded-md border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                                    title="View"
                                                >
                                                    <svg
                                                        className="h-4 w-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
                                                        />
                                                        <circle
                                                            cx="12"
                                                            cy="12"
                                                            r="3"
                                                            strokeWidth="2"
                                                        />
                                                    </svg>
                                                </button>

                                                {/* EDIT */}
                                                <button
                                                    onClick={() => openEditModal(book._id)}
                                                    type="button"
                                                    className="rounded-md border border-slate-200 p-2 text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                                                    title="Edit"
                                                >
                                                    <svg
                                                        className="h-4 w-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="m16.862 4.487 2.651 2.65M4 20h4l10.5-10.5a1.875 1.875 0 0 0-2.65-2.65L5.35 17.35 4 20Z"
                                                        />
                                                    </svg>
                                                </button>

                                                {/* DELETE */}
                                                <button
                                                    onClick={() => handleDeleteBook(book._id)}
                                                    type="button"
                                                    className="rounded-md border border-slate-200 p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                                    title="Delete"
                                                >
                                                    <svg
                                                        className="h-4 w-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"
                                                        />
                                                    </svg>
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-5 py-16 text-center"
                                    >
                                        <div className="flex flex-col items-center justify-center">

                                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                                                <svg
                                                    className="h-7 w-7 text-slate-400"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="1.8"
                                                        d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h4"
                                                    />
                                                </svg>
                                            </div>

                                            <p className="text-sm font-semibold text-slate-700">
                                                No books found
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                                {search || category
                                                    ? "Try changing your search or category filter."
                                                    : "There are no books available yet."}
                                            </p>

                                        </div>
                                    </td>
                                </tr>
                            )}

                        </tbody>

                    </table>

                </div>

            </div>

            {/* ================= PAGINATION ================= */}
            <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">

                <p className="text-sm text-slate-500">
                    Showing{" "}
                    <span className="font-medium text-slate-700">
                        {totalBooks === 0 ? 0 : (page - 1) * limit + 1}
                    </span>
                    {" "}to{" "}
                    <span className="font-medium text-slate-700">
                        {Math.min(page * limit, totalBooks)}
                    </span>
                    {" "}of{" "}
                    <span className="font-medium text-slate-700">
                        {totalBooks}
                    </span>{" "}
                    books
                </p>

                <div className="flex items-center gap-1">

                    {/* Previous */}
                    <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Prev
                    </button>

                    {/* Page Numbers (windowed) */}
                    {getVisiblePageNumbers().map((pageNumber, i) =>
                        typeof pageNumber === "string" ? (
                            <span
                                key={pageNumber + i}
                                className="px-2 text-sm text-slate-400"
                            >
                                …
                            </span>
                        ) : (
                            <button
                                key={pageNumber}
                                type="button"
                                onClick={() => setPage(pageNumber)}
                                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                                    page === pageNumber
                                        ? "bg-blue-600 text-white"
                                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                {pageNumber}
                            </button>
                        )
                    )}

                    {/* Next */}
                    <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Next
                    </button>

                </div>

            </div>

            {/* ================= ADD MODAL ================= */}
            {isAddModalOpen && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">

                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

                            <h2 className="text-lg font-semibold text-slate-800">
                                Add Book
                            </h2>

                            <button
                                onClick={closeAddModal}
                                type="button"
                                className="text-2xl text-slate-400 hover:text-slate-600"
                            >
                                ×
                            </button>

                        </div>

                        <form onSubmit={handleAddBook}>

                            <div className="p-6">

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Book Title
                                        </label>

                                        <input
                                            name="title"
                                            value={addBook.title}
                                            onChange={handleChange}
                                            type="text"
                                            placeholder="Enter book title"
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Author
                                        </label>

                                        <input
                                            type="text"
                                            name="author"
                                            value={addBook.author}
                                            onChange={handleChange}
                                            placeholder="Enter author name"
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Category
                                        </label>

                                        <select
                                            name="category"
                                            value={addBook.category}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm"
                                        >
                                            <option value="">
                                                Select category
                                            </option>

                                            <option value="Fiction">
                                                Fiction
                                            </option>

                                            <option value="Programming">
                                                Programming
                                            </option>

                                            <option value="Self Help">
                                                Self Help
                                            </option>

                                            <option value="Biography">
                                                Biography
                                            </option>

                                        </select>

                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Price
                                        </label>

                                        <input
                                            type="number"
                                            name="price"
                                            value={addBook.price}
                                            onChange={handleChange}
                                            placeholder="₹"
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Published Year
                                        </label>

                                        <input
                                            type="number"
                                            name="publishedYear"
                                            value={addBook.publishedYear}
                                            onChange={handleChange}
                                            placeholder="2026"
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div className="md:col-span-2">

                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Description
                                        </label>

                                        <textarea
                                            rows="4"
                                            name="description"
                                            value={addBook.description}
                                            onChange={handleChange}
                                            placeholder="Enter book description"
                                            className="w-full resize-none rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                </div>

                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">

                                <button
                                    onClick={closeAddModal}
                                    type="button"
                                    className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    Add Book
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            {/* ================= VIEW MODAL ================= */}
            {isViewModalOpen && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">

                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

                            <h2 className="text-lg font-semibold text-slate-800">
                                Book Details
                            </h2>

                            <button
                                onClick={closeViewModal}
                                type="button"
                                className="text-2xl text-slate-400 hover:text-slate-600"
                            >
                                ×
                            </button>

                        </div>

                        <div className="p-6">

                            {getSingleBook && (

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-500">
                                            Book Title
                                        </label>

                                        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-800">
                                            {getSingleBook.title}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-500">
                                            Author
                                        </label>

                                        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-800">
                                            {getSingleBook.author}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-500">
                                            Category
                                        </label>

                                        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-800">
                                            {getSingleBook.category}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-500">
                                            Price
                                        </label>

                                        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-800">
                                            {getSingleBook.price}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-500">
                                            Published Year
                                        </label>

                                        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-800">
                                            {getSingleBook.publishedYear}
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">

                                        <label className="mb-2 block text-sm font-medium text-slate-500">
                                            Description
                                        </label>

                                        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800">
                                            {getSingleBook.description}
                                        </div>

                                    </div>

                                </div>

                            )}

                        </div>

                        <div className="flex justify-end border-t border-slate-200 px-6 py-4">

                            <button
                                onClick={closeViewModal}
                                type="button"
                                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* ================= EDIT MODAL ================= */}
            {isEditModalOpen && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">

                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

                            <h2 className="text-lg font-semibold text-slate-800">
                                Edit Book
                            </h2>

                            <button
                                onClick={closeEditModal}
                                type="button"
                                className="text-2xl text-slate-400 hover:text-slate-600"
                            >
                                ×
                            </button>

                        </div>

                        <form onSubmit={handleEditBook}>

                            <div className="p-6">

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Book Title
                                        </label>

                                        <input
                                            type="text"
                                            name="title"
                                            value={addBook.title}
                                            onChange={handleChange}
                                            placeholder="Enter book title"
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Author
                                        </label>

                                        <input
                                            type="text"
                                            name="author"
                                            value={addBook.author}
                                            onChange={handleChange}
                                            placeholder="Enter author name"
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Category
                                        </label>

                                        <select
                                            name="category"
                                            value={addBook.category}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm"
                                        >
                                            <option value="">
                                                Select category
                                            </option>

                                            <option value="Fiction">
                                                Fiction
                                            </option>

                                            <option value="Programming">
                                                Programming
                                            </option>

                                            <option value="Self Help">
                                                Self Help
                                            </option>

                                            <option value="Biography">
                                                Biography
                                            </option>

                                        </select>

                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Price
                                        </label>

                                        <input
                                            type="number"
                                            name="price"
                                            value={addBook.price}
                                            onChange={handleChange}
                                            placeholder="₹"
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Published Year
                                        </label>

                                        <input
                                            type="number"
                                            name="publishedYear"
                                            value={addBook.publishedYear}
                                            onChange={handleChange}
                                            placeholder="2026"
                                            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div className="md:col-span-2">

                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Description
                                        </label>

                                        <textarea
                                            rows="4"
                                            name="description"
                                            value={addBook.description}
                                            onChange={handleChange}
                                            placeholder="Enter book description"
                                            className="w-full resize-none rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                </div>

                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">

                                <button
                                    onClick={closeEditModal}
                                    type="button"
                                    className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    Update Book
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
};

export default BookPage;