function maxProfit (prices) {
    if(!prices) return 0;
    let minimum = prices[0];
    let max = 0;
    for (let i=1; i<prices.length; i++){
        const price = prices[i];
        if(price < minimum) {
            minimum = price;
        }else if(price - minimum > max){
            max = price - minimum;
        }
    }
    return max
}