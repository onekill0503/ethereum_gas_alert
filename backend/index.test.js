const rewire = require("rewire")
const index = rewire("./index")
const makePlaceholder = index.__get__("makePlaceholder")
// @ponicode
describe("makePlaceholder", () => {
    test("0", () => {
        let param1 = [{ id: 1 }, { id: 3 }, { id: 7 }, { id: 5 }]
        let result = makePlaceholder(param1)
        expect(result).toBe("(1,3,7,5)")
    })
})
