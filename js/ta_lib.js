class Ta {
    static Ema(data, periods, isLastPeriodClosed = true) {
        // Validate data length
        const requiredDataLength = isLastPeriodClosed ? periods : periods + 1;
        if (data.length < requiredDataLength) {
            throw new Error(
                `Not enough data to calculate EMA${periods}. Requires at least ${requiredDataLength} data points.`
            );
        }

        // Exclude the last day if it's not closed
        const filteredData = isLastPeriodClosed ? data : data.slice(0, -1);

        // Multiplier for EMA smoothing
        const multiplier = 2 / (periods + 1);

        // Initialize EMA with SMA for the first period
        let ema = filteredData.slice(0, periods).reduce((sum, val) => sum + val, 0) / periods;
        const emaValues = Array(periods - 1).fill(null); // Fill initial values with null

        // Push the first EMA value
        emaValues.push(ema);

        // Calculate subsequent EMA values
        for (let i = periods; i < filteredData.length; i++) {
            ema = (filteredData[i] - ema) * multiplier + ema;
            emaValues.push(ema);
        }

        return emaValues;
    }


    static Sma(data, periods, isLastPeriodClosed) {
        const requiredDataLength = isLastPeriodClosed ? periods : periods + 1;

        if (data.length < requiredDataLength) {
            throw new Error(
                `Not enough data to calculate SMA${periods}. Requires at least ${requiredDataLength} data points.`
            );
        }

        const filteredData = isLastPeriodClosed ? data : data.slice(0, -1);

        // Efficient SMA calculation using a sliding window
        const smaValues = [];
        let sum = 0;

        for (let i = 0; i < filteredData.length; i++) {
            sum += filteredData[i];

            if (i >= periods - 1) {
                if (i >= periods) sum -= filteredData[i - periods];
                smaValues.push(sum / periods);
            } else {
                smaValues.push(null); // Not enough data
            }
        }

        return smaValues;
    }

    static Rsi(values, periods, isLastPeriodClosed = true) {
        // Adjust required data length based on whether the last period is closed
        const requiredDataLength = isLastPeriodClosed ? periods + 1 : periods;

        if (values.length < requiredDataLength) {
            throw new Error(
                `Not enough data to calculate RSI${periods}. Requires at least ${requiredDataLength} data points.`
            );
        }

        // Exclude last day's value if the last period is not closed
        const filteredValues = isLastPeriodClosed ? values : values.slice(0, -1);

        const gains = [];
        const losses = [];

        // Calculate initial gains and losses
        for (let i = 1; i <= periods; i++) {
            const change = filteredValues[i] - filteredValues[i - 1];
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? Math.abs(change) : 0);
        }

        // Calculate initial average gain and loss
        let avgGain = gains.reduce((sum, gain) => sum + gain, 0) / periods;
        let avgLoss = losses.reduce((sum, loss) => sum + loss, 0) / periods;

        const rsiValues = Array(periods).fill(null); // Fill initial periods with null

        // Calculate RSI for the first valid period
        const rs = avgGain / avgLoss;
        rsiValues.push(100 - 100 / (1 + rs));

        // Calculate subsequent RSI values
        for (let i = periods + 1; i < filteredValues.length; i++) {
            const change = filteredValues[i] - filteredValues[i - 1];
            const gain = change > 0 ? change : 0;
            const loss = change < 0 ? Math.abs(change) : 0;

            avgGain = (avgGain * (periods - 1) + gain) / periods;
            avgLoss = (avgLoss * (periods - 1) + loss) / periods;

            const rs = avgGain / avgLoss;
            rsiValues.push(100 - 100 / (1 + rs));
        }

        return rsiValues;
    }

    static HasConsecutiveRedDays(klines, count) {
        if (klines.length <= count) {
            throw new Error("Not enough data to check consecutive red days");
        }

        // Exclude the last day and check for `count` consecutive red days
        const validKlines = klines.slice(0, -1); // Exclude last day
        return validKlines
            .slice(-count)
            .every(day => day.close < day.open);
    }

    static ChangePercent(kline) {
        const changePercent = ((kline.close - kline.open) / kline.open * 100).toFixed(2);
        return changePercent;
    }
}

