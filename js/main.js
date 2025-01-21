class Model {
    constructor() {
        this.assets = [];
        this.isBusy = false;
        this.knownFilters = Filter.KnownFilters();
        this.filter = Filter.NoFilter;
        this.filteredAssets = [];
    }
}

class Controller {
    constructor() {
        this.model = new Model();
        this.view = new View(this);
        this.model.knownFilters.forEach((value) => this.view.addFilter(value));
        this.view.toggleBusyState(this.model);
    }

    changeFilter(aFilter) {
        this.model.filter = aFilter;
    }

    applyFilter() {
        this.model.filteredAssets = this.model.assets.filter(anAsset => applyFilter(this.model.filter, anAsset));
        this.view.clearScreenerResults();
        this.model.filteredAssets.forEach((aFilteredAsset) => this.view.addScreenerResult(aFilteredAsset));
    }

    async refreshData() {
        this.model.isBusy = true;
        this.view.toggleBusyState(this.model);
        try {
            this.model.assets = await fetchDailyUsdcCoinsFromBinanceAndComputeIndicatorValues();
            this.applyFilter();
        } catch (err) {
            console.log(err);
            this.view.displayError(err);
        } finally {
            this.model.isBusy = false;
            this.view.toggleBusyState(this.model);
        }
    }
}

class View {
    constructor(aController) {
        this.controller = aController;
        //=============================================
        //init filters
        //==============================================
        this.filterDropdown = document.getElementById('filter-dropdown');
        this.filterDropdown.addEventListener("change", (evt) => {
            this.controller.changeFilter(this.getSelectedFilter());
            this.controller.applyFilter();
        });

        //==============================================
        // init refresh button
        //==============================================
        this.refreshButton = document.getElementById('refresh-button');
        this.refreshButton.addEventListener("click", (evt) => {
            this.controller.changeFilter(this.getSelectedFilter());
            this.controller.refreshData();
        });

        //==============================================
        // Results grid
        //==============================================
        this.screenerResults = document.getElementById('screener-grid-results');
        this.clearScreenerResults();
    }

    addFilter(aFilter) {
        this.filterDropdown.innerHTML += `<option value="${aFilter.idx}">${aFilter.name}</option>`
    }

    toggleBusyState(aModel) {
        this.refreshButton.disabled = aModel.isBusy;
        this.filterDropdown.disabled = aModel.isBusy;
        this.refreshButton.ariaBusy = aModel.isBusy;
    }

    getSelectedFilter() {
        const filterIdx = this.filterDropdown.value;
        const filter = Filter.FindByIdx(filterIdx);
        return filter;
    }

    displayError(err) {
        alert(err);
    }

    clearScreenerResults() {
        this.screenerResults.innerHTML = '';
    }

    addScreenerResult(item) {
        const div = document.createElement('div');
        const signum = item.changePercent > 0 ? "&#x25B2;" : "&#x25BC;";
        const colorClass = item.changePercent > 0 ? "color-percent-change-up" : "color-percent-change-down";
        div.innerHTML =
            `
          <article class="card">
          <div class="card-row">
            <img src="img/coins/${item.name.toLowerCase()}.svg" onerror="useFallbackIcon(this)" class="crypto-icon"></img>
            <div class="card-info">
              <h4 class="base-asset">${item.name}</h4>
               <div class="base-asset-details">
                <p class="no-margin-bottom">${item.close}</p>
                <p class="no-margin-bottom ${colorClass}">${signum}${item.changePercent} %</p>
              </div>
            </div>
            <button class="outline contrast" onclick="window.open('https://www.tradingview.com/symbols/${item.name}USDC/?exchange=BINANCE')">&rarr;</button>
          </div>
        </article>
          `;
        this.screenerResults.appendChild(div);
    }
}





function useFallbackIcon(e) {
    e.src = "img/coins/fallback.svg";
}

function openInfoDialog() {
    const dialog = document.getElementById("info-dialog");
    dialog.showModal();
}

function closeInfoDialog() {
    const dialog = document.getElementById("info-dialog");
    dialog.close();
}