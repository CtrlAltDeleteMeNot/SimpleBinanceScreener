class Filter {
    static All = new Filter('All', 0);
    static PercentSinceOpenMoreThan5 = new Filter('Minimum 5% since day opening', 1);
    static PercentSinceOpenMoreThan10 = new Filter('Minimum 10% since day opening', 2);
    static FourRedDays = new Filter('Four consecutive red days', 3);
    static Rsi2LessThan5 = new Filter('RSI(2) less than 5', 4);
    static Rsi2MoreThan95 = new Filter('RSI(2) more than 95', 5);
    static AboveSma200 = new Filter('Price above SMA(200)', 6);
    static Sma50AboveSma200 = new Filter('SMA(50) above SMA(200)', 7);
    static LongLowerShadow = new Filter('Long lower shadow', 8);
    static LongUpperShadow = new Filter('Long upper shadow', 9);
    static MacdBuySignal = new Filter('MACD(12,26,9) buy', 10);
    static MacdSellSignal = new Filter('MACD(12,26,9) sell', 11);

    constructor(name, idx) {
        this.name = name;
        this.idx = idx;
    }

    toString() {
        return `Filter.${this.name}`;
    }

    equals(aStringValue) {
        return this.name === aStringValue;
    }

    static KnownFilters() {
        return Object.values(Filter).filter(val => val instanceof Filter);
    }

    static FindByIdx(idx) {
        return this.KnownFilters().find(filter => filter.idx === Number(idx)) || null;
    }
}