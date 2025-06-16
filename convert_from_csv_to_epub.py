import json
from decimal import Decimal, getcontext
from creat_lib_epub import create_epub
from validate_books import is_same_book
from create_amazon_lib_epub import create_with_amazon_data_epub

def analyze_details(arr: list[str]):
    utleriori_dettagli = []
    dettagli_dict = {}
    for item in arr:
        bal = item.split(":")
        if len(bal) == 2:
            key, value = bal
            key = key.strip()[:-2]
            value = value.strip()[2:]
            dettagli_dict[key] = value
        elif bal[0].startswith("n."):
            utleriori_dettagli.append(bal[0])
    if utleriori_dettagli:
        dettagli_dict["utleriori_dettagli"] = utleriori_dettagli
    return dettagli_dict 
# Read the CSV file and create EPUB files
with open('cleanup.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    
getcontext().prec = 10
totla_price = 0
total_books = 0
total_valide_book = 0
estimated_price = 0
book_not_found_price = Decimal(10)

for book in data:
    total_books+=1
    idBook=book
    book = data[book]
    totolo_lib: str = book["query"]
    autore_lib: str = book["autore"]
    editore_lib: str = book["casaEditrice"]
    anno_lib: str = book["anno"]
    if anno_lib.isnumeric():
        anno_lib = int(anno_lib)
    categoria_lib: str = book["categoria"]
    scomparto_lib: str = book["scomparto"]
    note_lib: str = book["note"]
    if book["success"]:
        search_on_amazon = book["urlSearch"]
        image_downloaded = book["imageDwonloaded"]
        bookdata = book["data"]
        titolo_amazon: str = bookdata["itemTitle"]
        autore_amazon: str = bookdata["itemAuthor"]
        url_amazon: str = bookdata["itemUrl"]
        desc_amazon: str = bookdata.get("description")
        dettagli = bookdata.get("details")
        if not titolo_amazon:
            estimated_price += book_not_found_price
            create_epub(book_id=idBook, category=categoria_lib, notes=note_lib, author=autore_lib,compartment=scomparto_lib, publisher=editore_lib,title=totolo_lib, year=anno_lib,cover_image_path=f"./covers/{image_downloaded}", searchOnAmazon=search_on_amazon)
            continue 
        
        dettagli = analyze_details(dettagli)
        verifica = is_same_book(autore_amazon=autore_amazon, autore_lib=autore_lib, titolo_amazon=titolo_amazon, titolo_lib=totolo_lib)       
        
        price: str = bookdata["itemPrice"]
        if price:
            total_valide_book += 1
            number_price = price.split()[0].split(",")
            if len(number_price) > 1 and number_price[0].isnumeric() and number_price[1].isnumeric():
                price = Decimal(".".join(number_price))
                totla_price += price
                estimated_price += price
        else:
            estimated_price += book_not_found_price
        
        if verifica:
            create_with_amazon_data_epub(book_id=idBook, autoreAmazon=autore_amazon, urlAmazon=url_amazon, descriptionAmazon=desc_amazon, dettagliAmazon=dettagli, priceAmazon=price, searchOnAmazon=search_on_amazon, category=categoria_lib, notes=note_lib, author=autore_lib,compartment=scomparto_lib, publisher=editore_lib,title=totolo_lib, year=anno_lib,cover_image_path=f"./covers/{image_downloaded}")
        else: 
            create_epub(book_id=idBook, category=categoria_lib, notes=note_lib, author=autore_lib,compartment=scomparto_lib, publisher=editore_lib,title=totolo_lib, year=anno_lib,cover_image_path=f"./covers/{image_downloaded}", searchOnAmazon=search_on_amazon)
    else:
        estimated_price += book_not_found_price
        create_epub(book_id=idBook, category=categoria_lib, notes=note_lib, author=autore_lib,compartment=scomparto_lib, publisher=editore_lib,title=totolo_lib, year=anno_lib,cover_image_path=f"./covers/not_found.jpg", searchOnAmazon=search_on_amazon)
print("total price: ", totla_price)
print("estimated price: ", estimated_price)
print("total books: ", total_books)
print("total valide books: ", total_valide_book)

#print("EPUB files have been created successfully.")

