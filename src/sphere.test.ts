import * as KdTree from "./tree"
import { compareAndCheck, randomPoints } from "./test_util"

const array = randomPoints(1000, "geo-points", -100, 0, -10, 70)
array.push(
  {x: 170, y:0}
)


describe("sphere", () => {
  var tree: KdTree.SearchNode
  test("build", () => {
    tree = KdTree.buildTree(array)
  })
  test("normal", () => {
    compareAndCheck(randomPoints(100, "geo-query", -180, 180, -90, 90), array, tree, KdTree.MeasureType.Geodesic)
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
    compareAndCheck(points, array, tree, KdTree.MeasureType.Geodesic)
  })
  test("release", () => {
    KdTree.releaseTree(tree)
  })
})


