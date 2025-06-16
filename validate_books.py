import difflib
import string

def normalize_text(text):
    """Rende il testo minuscolo e rimuove la punteggiatura."""
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    return text.strip()

def is_same_book(titolo_lib, titolo_amazon, autore_lib, autore_amazon):
    """
    Verifica se due libri sono lo stesso basandosi sul titolo e sull'autore.
    """
    # Normalizza i titoli
    title_amazon = normalize_text(titolo_amazon)
    title_library = normalize_text(titolo_lib)

    # Calcola similarità tra titoli
    title_similarity = difflib.SequenceMatcher(None, title_amazon, title_library).ratio() * 100

    # Verifica presenza di 'susan sontag' in entrambi gli autori
    author_amazon: str = normalize_text(autore_amazon)
    author_library: str = normalize_text(autore_lib)
    author_match = False
    for el in author_library.split():
        for el2 in author_amazon.split():
            if el == el2:
                author_match = True

    # Condizione finale
    is_match = title_similarity > 70 and author_match

    return {
        'is_match': is_match,
        'title_similarity': title_similarity,
        'author_match': author_match
    }