# Library Book EPUB Generator

This project automates the process of creating EPUB files for a library of books using Python. It takes as input a CSV file containing book data, scrapes additional information (such as images, ISBN, and price) from the web using a Nightmare.js-based web scraper, and generates EPUB files for each book with the collected data.

## Features

- **CSV Input:** Reads a CSV file (books.csv) with book metadata (title, author, publisher, etc.).
- **Web Scraping:** Uses a Node.js script with Nightmare.js to scrape book cover images, ISBN, and price from the web.
- **EPUB Generation:** Converts each book entry into an EPUB file, embedding the cover image and metadata.
- **Python Automation:** The main logic for reading CSV and generating EPUBs is written in Python.

## How It Works

1. **Prepare the CSV:** List your books in books.csv with columns like ID, category, title, author, publisher, year, notes, and compartment.
2. **Scrape Data:** Run the web scraper (in scrape_images using Nightmare.js) to fetch cover images, ISBN, and price for each book. Images are saved in the covers directory.
3. **Generate EPUBs:** Run the Python script (convert_from_csv_to_epub.py) to read the CSV and generate an EPUB for each book, including the cover image and metadata.

## Requirements

- Python 3.x
- Node.js (for the web scraper)
- Python packages: `ebooklib`, `pandas`
- Node.js packages: `nightmare`, `axios`, `cheerio`, etc. (see package.json)

## Usage

1. Install Python and Node.js dependencies:
   ```sh
   pip install ebooklib pandas
   cd scrape_images
   npm install
   ```
2. Run the web scraper to fetch images and data.
3. Run the Python script to generate EPUBs:
   ```sh
   python convert_from_csv_to_epub.py
   ```

## Output

- EPUB files for each book, with metadata and cover images, saved in the project directory.
