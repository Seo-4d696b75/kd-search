import seedrandom from "seedrandom"
import { searchNearest } from "./search"
import {measure, MeasureType, Point2D, pointArrayEquals, SearchNode} from "./tree"

export function randomPoints(size: number, seed: string = new Date().toString(), x_lower: number = 0, x_upper: number = 100,
  y_lower: number = 0, y_upper: number = 100): Array<Point2D> {
  const random = seedrandom(seed)
  return Array(size).fill(0).map(() => {
    return {
      x: random() * (x_upper - x_lower) + x_lower,
      y: random() * (y_upper - y_lower) + y_lower,
    }
  })
}

export function compareAndCheck(queries: Array<Point2D>, points: Array<Point2D>, tree: SearchNode, type: MeasureType) {
  const random = seedrandom("params")
  queries.forEach(query => {
    points.sort((a, b) => measure(a, query, type) - measure(b, query, type))
    const farthest = points[points.length-1]
    const dist_max = measure(farthest, query, type)
    // various params: k, r
    for (var i = 0; i < 10; i++) {
      // r = 0
      let k = Math.floor(random() * Math.min(20, points.length * 0.2)) + 1
      let result = searchNearest(tree, query, k, 0, type)
      if (!pointArrayEquals(result, points.slice(0, result.length))) {
        console.error(`not matched. k=${k} r=0`)
      }
      // r > 0
      k = Math.floor(random() * Math.min(5, points.length * 0.1)) + 1
      const r = random() * 0.2 * dist_max
      result = searchNearest(tree, query, k, r, type)
      if (!pointArrayEquals(result, points.slice(0, result.length))) {
        console.error(`not matched. k=${k} r=${r}`)
      }
    }
  })
}