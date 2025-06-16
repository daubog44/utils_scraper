from ebooklib import epub
import os 
# Function to create an EPUB book
def create_epub(book_id, category, title, author, publisher, year, notes, compartment, cover_image_path, searchOnAmazon):
    book = epub.EpubBook()

    # Set metadata
    book.set_identifier(book_id)
    book.set_title(title)
    book.add_author(author)
    publisher and book.add_metadata('DC', 'publisher', publisher)
    str(year) and book.add_metadata('DC', 'date', str(year))
    book.add_metadata('DC', 'subject', category)
    compartment and book.add_metadata('DC', 'coverage', compartment)
    searchOnAmazon and book.add_metadata(None, 'meta', '', {'name': 'cerca in amazon', 'content': searchOnAmazon})
    notes and book.add_metadata(None, 'meta', '', {'name': 'note', 'content': notes})
    
    # Add custom content
    content = f"""
    <html>
    <head>
    <title>{title}</title>
    </head>
    <body>
    <h1>{title}</h1>
    <p><strong>Author:</strong> {author}</p>
    {publisher and f"<p><strong>Publisher:</strong> {publisher}</p>"}
    {str(year) and f"<p><strong>Year:</strong> {str(year)}</p>"}
    {notes and f"<p><strong>Notes:</strong> {notes}</p>"}
    {compartment and f"<p><strong>Compartment:</strong> {compartment}</p>"}
    {searchOnAmazon and f"<p><strong>Cerca su:</strong><a href={searchOnAmazon}> amazon</a></p>"}
    <p>This is a custom content section.</p>
    </body>
    </html>
    """
    chapter = epub.EpubHtml(title='Content', file_name='chap_01.xhtml', lang="it")
    chapter.set_content(content)
    book.add_item(chapter)

    book.set_cover("cover.jpg", open(cover_image_path, 'rb').read())
    # Define CSS style
    style = 'BODY {color: white;}'
    nav_css = epub.EpubItem(uid="style_nav", file_name="style/nav.css", media_type="text/css", content=style)
    book.add_item(nav_css)

    # Create spine
    book.spine = ['nav', chapter]

    # Write to the file
    epub.write_epub(f'./epubs/{title}.epub', book, {})