function print(n) {
    for (let i = 0; i < n; i++) {
        let row = ""
        for (let j = 0; j < n + i - n; j++) {
            row += " "
        }       
        // For star
        for (let j = 0; j < 2 * (n - i) - 1; j++) {
            row += "*"
        }
        // For space
        for (let j = 0; j < n + i - n; j++) {
            row += " "
        }
        console.log(row)
    }
}
print(5)
