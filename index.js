import { produceDataUrl } from "./js/api.js";
// dom
const showList = document.querySelector("#showList");
const settingNav = document.querySelector("#settingNav");
const pagination = document.querySelector("#pagination");
const searchKeyword = document.querySelector("#searchKeyword");
const select =  document.querySelector("#js-select");
const selectMobile = document.querySelector("#js-mobile-select");
const tableHead = document.querySelector("#tableHead");
const keyword = document.querySelector("#keyword");

const data = {
  produceData: [],
  filterData: [],
  currentTab: "all",
  currentPage: 1,
  currentRank: "up",
  isSearchState: false,
};

const settingValue = {
  perPageDataNum: 100,
};

const api = {
  getProduceData() {
    axios
      .get(produceDataUrl)
      .then((res) => {
        if (res.data.length === 0) {
          render.emptyMsg();
        } else {
          const originData = res.data;
          let filterData = originData.filter(
            (item) => item["作物名稱"] !== null && item["作物名稱"].length > 0
          );
          let produceData = filterData.map((item) => {
            return {
              ...item,
              id: item["作物代號"],
              crop: transData.crop(item["種類代碼"]),
            };
          });
          data.produceData = produceData;
          data.currentPage = 1;
          data.currentTab = "all";
          let renderData = transData.getPerPageData(
            data.produceData,
            data.currentPage
          );
          render.produceList(renderData);
          render.pagination(data.produceData.length);
          render.tabState(null, data.currentTab);
        }
      })
      .catch((err) => console.log(err));
  },
};

const render = {
  emptyMsg() {
    let rawHtml =
      ' <td colspan="7" class="text-center p-3">請輸入並搜尋想比價的作物名稱^＿^</td>';
    showList.innerHTML = rawHtml;
  },
  produceList(data) {
    let rawHtml = "";
    data.forEach((item) => {
      rawHtml += `
            <tr data-id=${item.id}>
                        <td data-td="title" data-id=${item.id}   width="15%">${item["作物名稱"]}</td>
                        <td data-td="market" data-id=${item.id}   width="15%">${item["市場名稱"]}</td>
                        <td data-td="max" data-id=${item.id} width="14%">${item["上價"]}</td>
                        <td data-td="mid" data-id=${item.id} width="14%">${item["中價"]}</td>
                        <td data-td="min" data-id=${item.id} width="14%">${item["下價"]}</td>
                        <td data-td="average" data-id=${item.id} width="14%">${item["平均價"]}</td>
                        <td data-td="tradingNum" data-id=${item.id} width="14%">${item["交易量"]}</td>
                    </tr>
            `;
      showList.innerHTML = rawHtml;
    });
  },
  pagination(dataNum) {
    const numberOfPages = transData.perPage(dataNum);
    let rawHTML = "";
    for (let pageNum = 1; pageNum <= numberOfPages; pageNum++) {
      let state = pageNum === data.currentPage ? "page-btn-checked" : "";
      rawHTML += `
            <li class="page-item"><a class="page-link page-btn ${state}" href="#" data-page="${pageNum}">${pageNum}</a></li>
            `;
    }
    pagination.innerHTML = rawHTML;
    document.documentElement.scrollTop = 0;
  },
  tabState(originTab, reNewTab) {
    if (originTab) {
      const oldTab = document.querySelector(`[data-crop="${originTab}"]`);
      oldTab.classList.remove("cropBtn-checked");
    }
    if (reNewTab) {
      const newTab = document.querySelector(`[data-crop="${reNewTab}"]`);
      newTab.classList.add("cropBtn-checked");
    }
  },
  currentKeyword(word) {
    let rawHtml
    if (word.length>0) {
      rawHtml = `
      <p>搜尋關鍵字:${word}<p>
      `;
    } else {
      rawHtml=""
    }
    keyword.innerHTML = rawHtml;
  },
};

const transData = {
  crop(data) {
    switch (data) {
      case "N04":
        return "vegetable";
      case "N05":
        return "fruit";
      case "N06":
        return "flower";
    }
  },
  perPage(data) {
    return Math.ceil(data / settingValue.perPageDataNum);
  },
  getPerPageData(data, pageNum) {
    const startIndex = (pageNum - 1) * settingValue.perPageDataNum;
    return data.slice(startIndex, startIndex + settingValue.perPageDataNum);
  },
  filterTab(originData, tab) {
    return originData.filter((item) => item.crop === tab);
  },
  searchKeyword(originData, keyword) {
    let data = originData.filter((item) => item["作物名稱"] !== null);
    return data.filter((item) => item["作物名稱"].includes(keyword));
  },
  sort(data, sortMode, rank) {
    let newData = [];
    if (rank === "up") {
      // 降冪
      newData = data.sort((a, b) => b[sortMode] - a[sortMode]);
    } else if (rank === "down") {
      // 升冪
      newData = data.sort((a, b) => a[sortMode] - b[sortMode]);
    }
    return newData;
  },
};

const event = {
  init() {
    api.getProduceData();
  },
  switchPage(e) {
    e.preventDefault();
    if (e.target.tagName !== "A") return;
    data.currentPage = Number(e.target.dataset.page);
    let originData = "";
    if (data.isSearchState) {
      originData = data.filterData;
    } else {
      originData =
        data.currentTab === "all" ? data.produceData : data.filterData;
    }
    let renderData = transData.getPerPageData(originData, data.currentPage);
    render.produceList(renderData);
    render.pagination(originData.length);
  },
  clickBoard(e) {
    e.preventDefault();
    let target = e.target;
    let targetNav = target.dataset.nav;
    if (targetNav === "tab") {
      event.switchCrop(target.dataset.crop);
    } else if (targetNav === "search") {
      event.searchData();
    }
  },
  switchCrop(tab) {
    render.tabState(data.currentTab, tab);
    data.currentPage = 1;
    data.currentTab = tab;
    data.isSearchState = false;
    let originData = "";
    if (tab === "all") {
      originData = data.produceData;
    } else {
      data.filterData = transData.filterTab(data.produceData, tab);
      originData = data.filterData;
    }
    let renderData = transData.getPerPageData(originData, data.currentPage);
    render.produceList(renderData);
    render.pagination(originData.length);
    render.currentKeyword("")
    let selectBox = document.querySelector('[data-nav="select"]');
    selectBox.value = 0;
  },
  searchData() {
    let keyword = searchKeyword.value.trim();
    data.isSearchState = false;
    if (keyword.length === 0) return alert("請先輸入搜尋關鍵字");
    data.filterData = transData.searchKeyword(data.produceData, keyword);
    if (data.filterData.length === 0) {
      alert(`您輸入的關鍵字：${keyword} ，沒有符合的結果`);
      searchKeyword.value = "";
      return;
    } else {
      data.currentPage = 1;
      data.isSearchState = true;
      let renderData = transData.getPerPageData(
        data.filterData,
        data.currentPage
      );
      render.produceList(renderData);
      render.pagination(data.filterData.length);
      render.tabState(data.currentTab, "all");
      data.currentTab = "all";
      render.currentKeyword(keyword)
      searchKeyword.value = "";
      select.value = 0;
      selectMoblie.value = 0;
    }
  },
  keyupBoard(e) {
    e.preventDefault();
    if (!e.keyCode) return;
    if (e.keyCode === 13) {
      event.searchData();
    }
  },
  selectBoard(e) {
    e.preventDefault();
    let target = e.target;
    let targetNav = target.dataset.nav;
    if (targetNav === "select") {
      data.currentRank = "up";
      event.selectDisplay(target.value, data.currentRank);
    }
  },
  selectDisplay(sortMode, rank) {
    let originData =
      data.currentTab === "all" ? data.produceData : data.filterData;
    data.currentPage = 1;
    let renderData = transData.sort(originData, sortMode, rank);
    renderData = transData.getPerPageData(renderData, data.currentPage);
    render.produceList(renderData);
    render.pagination(originData.length);
  },
  tableHeadRank(e) {
    e.preventDefault();
    let target = e.target;
    let targetNav = target.dataset.nav;
    if (targetNav === "thead") {
      let priceType = target.dataset.price;
      let rank = target.dataset.rank;
      event.selectDisplay(priceType, rank);
      // 選單連動
    select.value = priceType;
    selectMobile.value = priceType;
    }
  },
};

event.init();

// add Event listener
pagination.addEventListener("click", event.switchPage);
settingNav.addEventListener("click", event.clickBoard);
settingNav.addEventListener("change", event.selectBoard);
selectMobile.addEventListener("change", event.selectBoard);
settingNav.addEventListener("keyup", event.keyupBoard);
tableHead.addEventListener("click", event.tableHeadRank);
