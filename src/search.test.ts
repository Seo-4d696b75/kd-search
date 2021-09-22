import * as KdTree from "./index"

var array = KdTree.randomPoints(10000)
var array1 = Array.from(array)
var array2 = Array.from(array)
var queries = KdTree.randomPoints(100)

describe("kd-tree", () => {
  test("validate", () => {
    var tree = KdTree.buildTree(array2)
    queries.forEach( query => {
      array1.sort((a, b) => KdTree.measure(a,query) - KdTree.measure(b,query))
      // various params: k, r
      for ( var i=0 ; i<100 ; i++ ){
        // r = 0
        var k = Math.round(Math.random() * 20) + 1
        var result = KdTree.searchNearest(tree, query, k, 0)
        if ( !KdTree.pointArrayEquals(result,array1.slice(0, result.length))) {
          console.error(`not matched. k=${k} r=0`)
        }
        // r > 0
        k = Math.round(Math.random() * 5) + 1
        var r = Math.random() * 20
        var result2 = KdTree.searchNearest(tree, query, k, 0)
        if ( !KdTree.pointArrayEquals(result2,array1.slice(0, result2.length))) {
          console.error(`not matched. k=1 r=${r}`)
        }
      }
    })
    KdTree.releaseTree(tree)
  })
})


