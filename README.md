# Hospital Management System — Backend

A RESTful API backend for managing hospital users, doctors, patients, and appointments. Built with JavaScript, Node.js, Express.js, and MongoDB.

## Tech Stack

- **Node.js & Express.js** — Backend server and REST APIs
- **MongoDB & Mongoose** — Database and data models
- **JWT** — Authentication
- **Zod** — Request validation
- **Multer & Cloudinary** — Image uploads and storage

## Features

- User registration and login
- Role-based access for Admin, Doctor, and Patient
- Admin account initialization using a seed script
- Doctor profile creation, viewing, updating, and deletion
- Patient management
- Appointment booking with doctor availability and time-slot checks
- Appointment status updates: pending, confirmed, completed, and cancelled
- Separate appointment views for patients, doctors, and administrators
- Doctor profile image uploads
- Protected API routes
- Request validation and centralized error handling

## Project Structure

The backend uses a modular structure with separate routes, controllers, models, middleware, configuration, and utility functions.
