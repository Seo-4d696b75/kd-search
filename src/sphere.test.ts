import * as KdTree from "./tree"
import { compareAndCheck, randomPoints } from "./test_util"

var array = randomPoints(1000, "geo-points", -100, 0, -10, 70)
array.push(
  {x: 170, y:0}
)
var array1 = Array.from(array)
var array2 = Array.from(array)


describe("sphere", () => {
  var tree: KdTree.SearchNode
  test("build", () => {
    tree = KdTree.buildTree(array2)
  })
  test("normal", () => {
    compareAndCheck(randomPoints(100, "geo-query", -180, 180, -90, 90), array1, tree, KdTree.MeasureType.Geodesic)
  })
  test("singular", () => {
    var points: Array<KdTree.Point2D> = [
      { x: 0, y: 0 },
      { x: 90, y: 0 },
      { x: 130, y: 0 },
      { x: 0, y: 90 },
      { x: 0, y: -90 },
      { x: -180, y: 0 },
      { x: -180, y: 30 },
      { x: -180, y: 60 },
      { x: -180, y: -30 },
      { x: 180, y: 0 },
      { x: 180, y: 30 },
      { x: 180, y: 60 },
      { x: 180, y: -30 },
    ]
    compareAndCheck(points, array1, tree, KdTree.MeasureType.Geodesic)
  })
  test("release", () => {
    KdTree.releaseTree(tree)
  })
})


