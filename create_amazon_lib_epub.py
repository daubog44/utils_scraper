from ebooklib import epub
import os

def create_with_amazon_data_epub(book_id, category, title, author, publisher, year, notes, compartment,
                cover_image_path, searchOnAmazon, priceAmazon, dettagliAmazon,
                autoreAmazon, urlAmazon, descriptionAmazon):
    
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
    descriptionAmazon and book.add_metadata('DC', 'description', descriptionAmazon)
    priceAmazon and book.add_metadata(None, 'meta', '', {'name': 'prezzo', 'content': str(priceAmazon) + "€"})
    book.add_metadata(None, 'meta', '', {'name': 'autore (da amazon)', 'content': autoreAmazon})
    book.add_metadata(None, 'meta', '', {'name': 'vai alla pagina amazon', 'content': urlAmazon})
    
    dettagli_html = ""
    for detail in dettagliAmazon:
        book.add_metadata(None, 'meta', '', {'name': 'vai alla pagina amazon', 'content': urlAmazon})
        val = dettagliAmazon[detail]
        if detail == "utleriori_dettagli":
            i = 0
            for el in val:
                book.add_metadata(None, 'meta', '', {'name': f"altri dettagli{i}", 'content': el})
                dettagli_html += f"<p><strong>altri dettagli:</strong><ul>" + el +"</ul></p>"
                i+=1
        else:
            book.add_metadata(None, 'meta', '', {'name': detail, 'content': val})
            dettagli_html += f"<p><strong>{detail}:</strong> {val}</p>"
            
    cover_image_content = open(cover_image_path, 'rb').read()
    book.set_cover("cover.jpg", cover_image_content)
            
    # HTML content
    content = f"""
    <html>
    <head><title>{title}</title></head>
    <body>
    <h1>{title}</h1>
    <p><strong>Author:</strong> {author}</p>
    {publisher and f"<p><strong>Publisher:</strong> {publisher}</p>"}
    {str(year) and f"<p><strong>Year:</strong> {str(year)}</p>"}
    {notes and f"<p><strong>Notes:</strong> {notes}</p>"}
    {compartment and f"<p><strong>Compartment:</strong> {compartment}</p>"}
    {searchOnAmazon and f"<p><strong>Cerca su:</strong><a href={searchOnAmazon}> amazon</a></p>"}
    <h2>Amazon Info</h2>
    {str(priceAmazon) and f"<p><strong>Price:</strong> {str(priceAmazon)}</p>"}
    <p><strong>Author (Amazon):</strong> {autoreAmazon}€</p>
    <p><strong>prodotto:</strong> <a href="{urlAmazon}">vai alla pagina</a></p>
    {descriptionAmazon and f"<p><strong>Description (Amazon):</strong> {descriptionAmazon}</p>"}
    
    {dettagli_html and "<h3>Dettagli Amazon</h3>"}
    {dettagli_html}

    </body>
    </html>
    """
    chapter = epub.EpubHtml(title='Content', file_name='chap_01.xhtml', lang="it")
    chapter.set_content(content)
    book.add_item(chapter)
    
    # TOC and navigation
    #book.toc = (epub.Link('chap_01.xhtml', 'Content', 'content'),)
    #book.add_item(epub.EpubNcx())
    #book.add_item(epub.EpubNav())

    # CSS
    style = 'BODY {color: white;}'
    nav_css = epub.EpubItem(uid="style_nav", file_name="style/nav.css", media_type="text/css", content=style)
    book.add_item(nav_css)

    # Spine
    book.spine = ['nav', chapter]

    # Write EPUB
    epub.write_epub(f'./epubs/{title}.epub', book, {})
