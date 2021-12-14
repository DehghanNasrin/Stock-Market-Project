window.onload = function () {
  let today = new Date();
  let lastWeek = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 6
  );
  document.getElementById("fromDate").valueAsDate = lastWeek;
};

function init() {
  fetch("http://127.0.0.1:5000/")
    .then((response) => response.json())
    .then((data) => fillTickerDropDown(data))
    .catch((error) => {
      console.log("Error: ", error);
    });
}

function fillTickerDropDown(dataSet) {
  let dropdown = d3.select("#tickerDropdown");

  dropdown.append("option").text("").property("value", "");
  dataSet.forEach((data) => {
    dropdown.append("option").text(data).property("value", data);
  });
}

function getTickerInfo(ticker, fromDate, toDate) {
  let parameters = `${ticker}/${fromDate}/${toDate}`;
  fetch("http://127.0.0.1:5000/tickerinfo/" + new URLSearchParams(parameters))
    .then((response) => response.json())
    .then((data) => getStockInfo(data))
    .catch((error) => {
      console.log("Error: ", error);
    });
}

function getStockInfo(data) {
  let records = data.results;
  if (!records) return;

  let dataPoints1 = [];
  let dataPoints2 = [];
  let dataPoints3 = [];
  let fromDateValue = document.getElementById("fromDate").value;
  let toDate = document.getElementById("toDate");

  let ticker = document.getElementById("tickerDropdown").value;

  var stockChart = new CanvasJS.StockChart("chartContainer", {
    theme: "light1",
    charts: [
      {
        title: {
          text: `${ticker} Price in USD`,
        },
        axisY: {
          prefix: "$",
        },
        data: [
          {
            type: "candlestick",
            yValueFormatString: "$#,###.##",
            dataPoints: dataPoints1,
          },
        ],
      },
    ],
    backgroundColor: "#eccac0",
    rangeSelector: {
      enabled: false,
    },
    navigator: {
      slider: {
        minimum: new Date(fromDateValue),
        maximum: new Date(toDate.value),
      },
    },
  });

  var lineChart1 = new CanvasJS.StockChart("lineChartContainer1", {
    theme: "light2",
    charts: [
      {
        zoomEnabled: true,
        title: {
          text: `${ticker} Closing Price`,
        },
        axisY: {
          prefix: "$",
        },
        data: [
          {
            type: "line",
            dataPoints: dataPoints2,
          },
        ],
      },
    ],
    backgroundColor: "#eccaa0",
    rangeSelector: {
      enabled: false,
    },
    navigator: {
      slider: {
        minimum: new Date(fromDateValue),
        maximum: new Date(toDate.value),
      },
    },
  });

  var lineChart2 = new CanvasJS.StockChart("lineChartContainer2", {
    theme: "light2",
    charts: [
      {
        zoomEnabled: true,
        title: {
          text: `${ticker} Opening Price`,
        },
        axisY: {
          prefix: "$",
        },
        data: [
          {
            type: "line",
            dataPoints: dataPoints3,
          },
        ],
      },
    ],
    backgroundColor: "#eccae0",
    rangeSelector: {
      enabled: false,
    },
    navigator: {
      slider: {
        minimum: new Date(fromDateValue),
        maximum: new Date(toDate.value),
      },
    },
  });

  for (var i = 0; i < records.length; i++) {
    dataPoints1.push({
      x: new Date(timeConverter(records[i].t)),
      y: [
        Number(records[i].o),
        Number(records[i].h),
        Number(records[i].l),
        Number(records[i].c),
      ],
    });
    dataPoints2.push({
      x: new Date(timeConverter(records[i].t)),
      y: Number(records[i].c),
    });

    dataPoints3.push({
      x: new Date(timeConverter(records[i].t)),
      y: Number(records[i].o),
    });
  }

  stockChart.render();

  lineChart1.render();
  
  lineChart2.render();
}

function getGoogleNews(ticker) {
  fetch("http://127.0.0.1:5000/news/" + new URLSearchParams(ticker))
    .then((response) => response.json())
    .then((news) => fillNewsParagraph(news))
    .catch((error) => {
      console.log("Error: ", error);
    });
}

function fillNewsParagraph(news) {
  let p = document.getElementById("news");
  p.innerHTML = news;
}

function inputValueChangted() {
  let duration = document.getElementById("durationDropdown").value;
  let fromDateValue = document.getElementById("fromDate").value;
  let toDate = document.getElementById("toDate");
  let startDate = new Date(fromDateValue);
  let day = 60 * 60 * 24 * 1000;

  let endDate;

  switch (duration) {
    case "oneDay":
      endDate = new Date(startDate.getTime() + day);
      break;
    case "oneWeek":
      endDate = new Date(startDate.getTime() + day * 7);
      break;
    case "oneMonth":
      endDate = new Date(startDate.getTime() + day * 30);
      break;
    case "threeMonths":
      endDate = new Date(startDate.getTime() + day * 90);
      break;
    case "sixMonths":
      endDate = new Date(startDate.getTime() + day * 183);
      break;
    case "oneYear":
      endDate = new Date(startDate.getTime() + day * 365);
      break;
  }

  let date =
    endDate.getDate() < 10 ? `0${endDate.getDate()}` : `${endDate.getDate()}`;

  toDate.value = `${endDate.getFullYear()}-${endDate.getMonth() + 1}-${date}`;

  let ticker = document.getElementById("tickerDropdown").value;

  if (ticker && ticker !== "") {
    //getGoogleNews(ticker);
  }

  if (ticker && fromDateValue && toDate.value) {
    getTickerInfo(ticker, fromDateValue, toDate.value);
  }
}

function timeConverter(timestamp) {
  let unixTime = timestamp / 1000;
  let d = new Date(unixTime * 1000);
  let date = d.getDate() < 10 ? `0${d.getDate()}` : `${d.getDate()}`;
  let result = `${d.getFullYear()}-${d.getMonth() + 1}-${date}`;

  return result;
}

(function () {
  init();
})();
