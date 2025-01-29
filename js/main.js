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

    closeApplicationInfo() {
        this.view.toggleApplicationInfo(false);
    }

    showApplicationInfo() {
        this.view.toggleApplicationInfo(true);
    }

    closeAssetInfo() {
        this.view.toggleAssetInfo(false);
    }

    showAssetInfo(assetName) {
        try {
            const found = this.model.assets.find(anAsset => anAsset.name === assetName);
            if (found === undefined) {
                throw new Error(`Asset ${assetName} was not found.`);
            }
            this.view.updateAssetInfo(found);
            this.view.toggleAssetInfo(true);
        } catch (err) {
            console.log(err);
            this.view.displayError(err);
        }
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

        //==============================================
        // App info dialog
        //==============================================
        this.applicationInfoDialog = document.getElementById("application-info-dialog");

        //==============================================
        // Asset info dialog
        //==============================================
        this.assetInfoDialog = document.getElementById("asset-info-dialog");
        this.assetInfoName = document.getElementById("asset-info-name");
        this.assetInfoPicture = document.getElementById("asset-info-picture");
        this.assetInfoMore = document.getElementById("asset-info-more-details-button");
        this.assetInfoTechnicals = document.getElementById("asset-info-technicals");
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
            <button class="outline contrast" onclick="controller.showAssetInfo('${item.name}')">&rarr;</button>
          </div>
        </article>
          `;
        this.screenerResults.appendChild(div);
    }

    toggleApplicationInfo(visible) {
        if (visible === true) {
            this.applicationInfoDialog.showModal();
        }
        else {
            this.applicationInfoDialog.close();
        }
    }

    toggleAssetInfo(visible) {
        if (visible === true) {
            this.assetInfoDialog.showModal();
        }
        else {
            this.assetInfoDialog.close();
        }
    }

    formatNumber(aNumber, aDecimalCount) {
        if (aNumber === null || aNumber === undefined) {
            return "Not available";
        }
        return aNumber.toFixed(aDecimalCount);
    }

    updateAssetInfo(asset) {
        this.assetInfoName.innerHTML = asset.name;
        this.assetInfoMore.onclick = function () { window.open(`https://www.tradingview.com/symbols/${asset.name}USDC/?exchange=BINANCE`); };
        this.assetInfoPicture.src = `img/coins/${asset.name.toLowerCase()}.svg`;
        let map = [];
        map.push({ key: "Price", value: asset.close, precision: asset.precision });
        map.push({ key: "SMA(200)", value: asset.sma_200, precision: asset.precision });
        map.push({ key: "SMA(89)", value: asset.sma_089, precision: asset.precision });
        map.push({ key: "SMA(50)", value: asset.sma_050, precision: asset.precision });
        map.push({ key: "SMA(21)", value: asset.sma_021, precision: asset.precision });
        map.push({ key: "SMA(5)", value: asset.sma_005, precision: asset.precision });
        map = map.filter(a => a.value !== null);
        map.sort((a, b) => b.value - a.value);
        map.push({ key: "RSI(2)", value: asset.rsi_002, precision: 2 });
        map.push({ key: "RSI(14)", value: asset.rsi_014, precision: 2 });
        map.push({ key: "Change(%)", value: asset.changePercent, precision: 2 });
        map = map.filter(a => a.value !== null);
        let technicalsHtml = '';
        map.forEach(entry => technicalsHtml += `<tr><th scope="row">${entry.key}</th><td>${this.formatNumber(entry.value, entry.precision)}</td></tr>`);
        this.assetInfoTechnicals.innerHTML = technicalsHtml;
    }
}


function useFallbackIcon(e) {
    e.src = "img/coins/fallback.svg";
}