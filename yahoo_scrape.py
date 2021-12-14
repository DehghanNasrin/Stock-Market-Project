from lxml import html
import requests

def _get_most_active_stocks():
    url = "https://finance.yahoo.com/most-active"
    response = requests.get(url)
			
    if response.status_code!=200:
        raise ValueError("Server is not responding...")

    parser = html.fromstring(response.text)			
    xpath_value = '//*[@id="scr-res-table"]/div[1]/table/tbody//tr/td[1]/a'
    items =  parser.xpath(xpath_value)
    tickers = []
    for item in items:
        tickers.append(item.text)        
    
    return tickers


def active_stocks():
    return _get_most_active_stocks()
