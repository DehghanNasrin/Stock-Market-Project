from datetime import datetime
import requests
from requests.sessions import session
from sqlalchemy.sql.dml import Insert
from sqlalchemy.sql.expression import false
from config import *
from flask import Flask
from flask import jsonify
import requests
import json
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func, text, Table, MetaData, insert, Sequence, Column, Integer, String, DateTime
from sqlalchemy.engine import URL
from yahoo_scrape import active_stocks
from google_news_scrape import *

app = Flask(__name__)


@app.route('/')
def get_tickers():
    return jsonify(active_stocks())


@app.route('/tickerinfo/<ticker>/<from_date>/<to_date>')
def get_ticker_info_by_date(ticker, from_date, to_date):
    to_date = to_date[:-1]
    advanced_url = "https://api.polygon.io/v2/aggs/ticker/" + ticker + "/range/1/day/" + \
        from_date + "/" + to_date + "?adjusted=true&sort=asc&limit=120&apiKey=" + api_key

    response = requests.get(advanced_url)

    json = response.json()

    # if response.ok:
    #     persist_to_database(json)

    return json


@app.route('/news/<ticker>')
def google_newsScrape(ticker):
    return get_google_news(ticker)


def persist_to_database(data):
    engine = create_engine(
        f"postgresql+psycopg2://{user}:{password}@{server_address}/{database}")
    metadata_obj = MetaData()

    ticker = Table('tickers', metadata_obj,
                   Column('ticker_id', Integer, primary_key=True),
                   Column('symbol', String(16)))

    symbol = data['ticker']
    list = []
    with engine.connect() as conn:
        list = conn.execution_options(stream_results=True).execute(text("select symbol, ticker_id from tickers")).all()
        hasSymbol = False
        for item in list:
            if symbol in item[0]:
                hasSymbol = True
                break
        if hasSymbol == False:
            ins = ticker.insert()
            conn.execute(ins, {"symbol": symbol})
            compiled = ins.compile()

        list = conn.execution_options(stream_results=True).execute(text("select symbol, ticker_id from tickers")).all()

    records = data['results']

    ticker_info = Table('ticker_info', metadata_obj,
                        Column('id', Integer, primary_key=True),
                        Column('ticker_id', Integer),
                        Column('volume', String(64)),
                        Column('volume_weighted', String(64)),
                        Column('open_price', String(64)),
                        Column('close_price', String(64)),
                        Column('highest_price', String(64)),
                        Column('lowest_price', String(64)),
                        Column('request_datetime', DateTime),
                        Column('number_of_transactions', String(64))
                        )
    pk_symbol = {}
    mapped_columns = {'v': 'volume', 'vw': 'volume_weighted', 'o': 'open_price',
                      'c': 'close_price', 'h': 'highest_price', 'l': 'lowest_price', 'n': 'number_of_transactions'}

    with engine.connect() as conn:
        for key in list:
            pk_symbol[key.symbol] = key.ticker_id

        record = {}

        ins = ticker_info.insert()
        for row in records:
            record["ticker_id"] = pk_symbol[symbol]
            for column, value in row.items():
                if column == 't':
                    s = value / 1000.0
                    dt= datetime.fromtimestamp(s).strftime('%Y-%m-%d %H:%M:%S.%f')
                    record['request_datetime'] = dt
                    continue

                record[mapped_columns[column]] = value

            conn.execute(ins, record)
            compiled = ins.compile()


app.run('127.0.0.1', 5000)
