importScripts('binance_api.js', 'ta_lib.js', 'constants.js');


self.onmessage = async function handleMessageFromMain(msg) {
    if (msg.data !== undefined && msg.data.fetchThenApplyFilter !== undefined) {
        try {
            const filter = Filter.FindByIdx(msg.data.fetchThenApplyFilter.idx);
            var data = await fetchThenFilter(filter);
            self.postMessage({ success: true, data: data });
        } catch (error) {
            console.log(error);
            self.postMessage({ success: false, data: error });
        }
    }
};

async function fetchThenFilter(filter) {
    const symbols = await fetchUSDCTradingPairs();
    // Fetch klines for all symbols in parallel
    const klinesData = await Promise.all(
        symbols.map(async (symbol) => ({
            symbol,
            klines: await fetchDailyKlines(symbol.symbol, 300), // Fetch the last 300 days of klines
        }))
    );
    var to_return = [];
    for (const symbolWithKlines of klinesData) {
        const klines = symbolWithKlines.klines;
        if (!Array.isArray(klines)) {
            continue;
        }
        if (klines.length < 1) {
            continue;
        }

        const close_array = symbolWithKlines.klines.map(k => k.close);
        let change_percent = null;
        let arr_sma_200 = null;
        let arr_sma_050 = null;
        let arr_rsi_002 = null;
        let four_red_days = null;
        let long_lower_shadow_detected = null;
        let long_upper_shadow_detected = null;
        let macd_12_26_arr = null;
        let arr_rsi_014 = null;

        if (klines.length >= 5) {
            four_red_days = Ta.HasConsecutiveRedDays(klines, 4);
        }
        if (klines.length >= 35) {
            macd_12_26_arr = Ta.CalculateMACD(close_array, 12, 26, 9, false);
        }
        if (klines.length >= 2) {
            long_lower_shadow_detected = Ta.HasLongLowerShadow(klines, -1);
        }
        if (klines.length >= 2) {
            long_upper_shadow_detected = Ta.HasLongUpperShadow(klines, -1);
        }
        if (klines.length > 0) {
            change_percent = Ta.ChangePercent(klines, 0);
        }
        if (close_array.length > 200) {
            arr_sma_200 = Ta.Sma(close_array, 200, false);
        }
        if (close_array.length > 50) {
            arr_sma_050 = Ta.Sma(close_array, 50, false);
        }
        if (close_array.length > 2) {
            arr_rsi_002 = Ta.Rsi(close_array, 2, false);
        }
        if (close_array.length > 14) {
            arr_rsi_014 = Ta.Rsi(close_array, 14, false);
        }
        const rsi_002 = arr_rsi_002 != null ? arr_rsi_002.slice(-1)[0] : null;
        const rsi_014 = arr_rsi_014 != null ? arr_rsi_014.slice(-1)[0] : null;
        const sma_050 = arr_sma_050 != null ? arr_sma_050.slice(-1)[0] : null;
        const sma_200 = arr_sma_200 != null ? arr_sma_200.slice(-1)[0] : null;
        const macd_12_26 = macd_12_26_arr != null ? macd_12_26_arr.slice(-1)[0]: null;
        var obj = {
            name: symbolWithKlines.symbol.asset,
            changePercent: change_percent,
            hasFourConsecutiveRedDays: four_red_days,
            open: klines[klines.length - 1].open,
            close: parseFloat(klines[klines.length - 1].close),
            rsi_002: rsi_002,
            rsi_014: rsi_014,
            sma_200: sma_200,
            sma_050: sma_050,
            long_lower_shadow_detected: long_lower_shadow_detected,
            long_upper_shadow_detected: long_upper_shadow_detected,
            macd_12_26: macd_12_26
        };
        if (applyFilter(filter, obj)) {
            to_return.push(obj);
        }
        to_return.sort((a,b)=> a.changePercent > b.changePercent ? -1: 1);
    }
    return to_return;
}

// Utility: Apply filter logic dynamically
function applyFilter(filter, obj) {
    switch (filter.idx) {
        case Filter.All.idx:
            return true; // Always include
        case Filter.PercentSinceOpenMoreThan5.idx:
            return obj.changePercent > 5;
        case Filter.PercentSinceOpenMoreThan10.idx:
            return obj.changePercent > 10;
        case Filter.FourRedDays.idx:
            return obj.hasFourConsecutiveRedDays;
        case Filter.Rsi2LessThan5.idx:
            return obj.rsi_002 !== null && obj.rsi_002 < 5;
        case Filter.Rsi2MoreThan95.idx:
            return obj.rsi_002 !== null && obj.rsi_002 > 95;
        case Filter.AboveSma200.idx:
            return obj.sma_200 !== null && obj.sma_200 < obj.close;
        case Filter.Sma50AboveSma200.idx:
            return obj.sma_200 !== null && obj.sma_200 < obj.close && obj.sma_050 > obj.sma_200;
        case Filter.LongLowerShadow.idx:
            return obj.long_lower_shadow_detected === true;
        case Filter.LongUpperShadow.idx:
            return obj.long_upper_shadow_detected === true;
        case Filter.MacdBuySignal.idx:
            return obj.macd_12_26 !==null && obj.macd_12_26.buySignal === true;
        case Filter.MacdSellSignal.idx:
            return obj.macd_12_26 !==null && obj.macd_12_26.sellSignal === true;
        case Filter.Rsi14LessThan30.idx:
            return obj.rsi_014 !== null && obj.rsi_014 < 30;
        case Filter.Rsi14MoreThan70.idx:
            return obj.rsi_014 !== null && obj.rsi_014 > 70;
        default:
            throw new Error("Unknown filter.");
    }
}
