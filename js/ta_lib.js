class Ta {
    static Ema(data, periods, isLastPeriodClosed = true) {
        // Validate data length
        // Validate input
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Data must be a non-empty array.");
        }
        if (!Number.isInteger(periods) || periods <= 0) {
            throw new Error("Periods must be a positive integer.");
        }

        // Validate data length
        const requiredDataLength = isLastPeriodClosed ? periods : periods + 1;
        if (data.length < requiredDataLength) {
            throw new Error(
                `Not enough data to calculate EMA${periods}. Requires at least ${requiredDataLength} data points.`
            );
        }

        // Exclude the last day if it's not closed
        const filteredData = isLastPeriodClosed ? data : data.slice(0, -1);

        // Calculate the EMA multiplier
        const multiplier = 2 / (periods + 1);

        // Initialize EMA with SMA for the first period
        let ema = filteredData.slice(0, periods).reduce((sum, val) => sum + val, 0) / periods;

        // Create an array to store EMA values
        const emaValues = Array(periods - 1).fill(null); // Fill initial values with null
        emaValues.push(ema); // Add the first EMA value

        // Calculate subsequent EMA values
        for (let i = periods; i < filteredData.length; i++) {
            ema = (filteredData[i] - ema) * multiplier + ema;
            emaValues.push(ema);
        }
        return emaValues;
    }

    // Calculate MACD, Signal Line, Histogram, and Signals
    static CalculateMACD(data, shortPeriod = 12, longPeriod = 26, signalPeriod = 9, includeLastPeriod = true) {
        if (!Array.isArray(data) || data.length < longPeriod) {
            throw new Error(`Not enough data to calculate MACD. Requires at least ${longPeriod} data points.`);
        }

        // Exclude the last candlestick if includeLastPeriod is false
        const filteredData = includeLastPeriod ? data : data.slice(0, -1);

        // Calculate short-term and long-term EMAs
        const shortEMA = Ta.Ema(filteredData, shortPeriod, true);
        const longEMA = Ta.Ema(filteredData, longPeriod, true);

        // Calculate MACD Line
        const macdLine = shortEMA.map((short, i) =>
            short !== null && longEMA[i] !== null ? short - longEMA[i] : null
        );

        // Calculate Signal Line
        const signalLine = Ta.Ema(macdLine.filter(val => val !== null), signalPeriod);

        // Align Signal Line with MACD Line (add leading nulls)
        const alignedSignalLine = Array(longPeriod - 1).fill(null).concat(signalLine);

        // Calculate Histogram and Signals
        const macdData = macdLine.map((macd, i) => {
            if (macd === null || alignedSignalLine[i] === null) {
                return { macd: null, signal: null, histogram: null, signalType: null };
            }

            const signal = alignedSignalLine[i];
            const histogram = macd - signal;

            let buySignal = false;
            let sellSignal = false;
            if (i > 0 && macdLine[i - 1] !== null && alignedSignalLine[i - 1] !== null) {
                // Buy Signal: MACD crosses above Signal Line
                if (macdLine[i - 1] < alignedSignalLine[i - 1] && macd > signal) {
                    buySignal = true;
                }
                // Sell Signal: MACD crosses below Signal Line
                else if (macdLine[i - 1] > alignedSignalLine[i - 1] && macd < signal) {
                    sellSignal = true;
                }
            }

            return { macd, signal, histogram, buySignal, sellSignal };
        });

        return macdData;
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

    static ChangePercent(klines, offset) {
        if (!Array.isArray(klines) || klines.length === 0) {
            throw new Error("Klines array is empty or invalid");
        }

        if (offset > 0) {
            throw new Error("Positive offset are not allowed");
        }

        // Normalize offset for negative values
        const index = klines.length - 1 + offset;

        // Validate index range
        if (index < 0 || index >= klines.length) {
            throw new Error("Offset is out of bounds");
        }

        const kline = klines[index];

        // Check if the kline has valid open and close prices
        if (typeof (kline.open) !== 'number' || typeof (kline.close) !== 'number') {
            throw new Error("Invalid kline data");
        }

        const changePercent = ((kline.close - kline.open) / kline.open * 100);
        return parseFloat(changePercent.toFixed(2));
    }

    static HasLongLowerShadow(klines, offset) {
        if (!Array.isArray(klines) || klines.length === 0) {
            throw new Error("Klines array is empty or invalid");
        }

        if (offset > 0) {
            throw new Error("Positive offset are not allowed");
        }

        // Normalize offset for negative values
        const index = klines.length - 1 + offset;

        // Validate index range
        if (index < 0 || index >= klines.length) {
            throw new Error("Offset is out of bounds");
        }

        const kline = klines[index];

        // Check if the kline has valid open and close prices
        if (typeof (kline.open) !== 'number' || typeof (kline.close) !== 'number' || typeof (kline.high) !== 'number' || typeof (kline.low) !== 'number') {
            throw new Error("Invalid kline data");
        }

        // kline is an object with { open, high, low, close }
        const { open, high, low, close } = kline;

        // Calculate components
        const realBody = Math.abs(close - open);
        const lowerShadow = Math.min(open, close) - low;
        const upperShadow = high - Math.max(open, close);

        // Hammer criteria
        const isLowerShadowLong = lowerShadow >= 1.8 * realBody;
        const isUpperShadowSmall = upperShadow <= lowerShadow;

        return isLowerShadowLong && isUpperShadowSmall;
    }

    static HasLongUpperShadow(klines, offset) {
        if (!Array.isArray(klines) || klines.length === 0) {
            throw new Error("Klines array is empty or invalid");
        }

        if (offset > 0) {
            throw new Error("Positive offset are not allowed");
        }

        // Normalize offset for negative values
        const index = klines.length - 1 + offset;

        // Validate index range
        if (index < 0 || index >= klines.length) {
            throw new Error("Offset is out of bounds");
        }

        const kline = klines[index];

        // Check if the kline has valid open and close prices
        if (typeof (kline.open) !== 'number' || typeof (kline.close) !== 'number' || typeof (kline.high) !== 'number' || typeof (kline.low) !== 'number') {
            throw new Error("Invalid kline data");
        }

        // kline is an object with { open, high, low, close }
        const { open, high, low, close } = kline;

        // Calculate components
        const realBody = Math.abs(close - open);
        const lowerShadow = Math.min(open, close) - low;
        const upperShadow = high - Math.max(open, close);

        // Hammer criteria
        const isUpperShadowLong = upperShadow >= 1.8 * realBody;
        const isLowerShadowShort = upperShadow >= lowerShadow;

        return isUpperShadowLong && isLowerShadowShort;
    }
}

