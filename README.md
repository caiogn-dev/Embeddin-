# Insight PDF Explorer

Welcome to **Insight PDF Explorer**, a tool designed to help you explore, upload, and manage PDF documents with ease. This project combines a robust backend built with Django and a dynamic frontend developed with React and TypeScript.

## Overview

Insight PDF Explorer allows users to upload PDF files, view document lists, search through content, and gain insights from their documents through a user-friendly dashboard.

## Features

- **Document Upload**: Easily upload PDF files for processing.
- **Document Listing**: View all uploaded documents in an organized list.
- **Search Interface**: Search through document contents efficiently.
- **Dashboard**: Get insights and analytics on your document collection.

## Project Structure

- **Backend**: Built with Django, handling API requests, document processing, and integration with language models for content analysis.
- **Frontend**: Developed with React and TypeScript, providing a responsive and interactive user interface.

## Getting Started

### Prerequisites

- Python 3.x for the backend
- Node.js and npm for the frontend

### Installation

1. **Clone the Repository**:
   ```bash
   git clone [repository-url](https://github.com/caiogn-dev/insight-pdf-explore.git)
   cd insight-pdf-explorer
   ```

2. **Backend Setup**:
   ```bash
   cd src/beckend
   pip install -r requirements.txt
   python manage.py runserver
   ```

3. **Frontend Setup**:
   ```bash
   cd src
   npm install
   npm start
   ```

### Usage

- Access the application via `http://localhost:3000` for the frontend.
- The backend API is available at `http://localhost:8000/api/`.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
