/**
 * 平面状の点  
 * 
 * 球面を扱う場合は  
 * - x: 経度 longitude [deg] -180 <= x <= 180
 * - y: 緯度 latitude [deg] -90 <= y <= 90
 */
export interface Point2D {
  x: number
  y: number
}

export function pointEquals(a: Point2D, b: Point2D) {
  return a.x === b.x && a.y === b.y
}

export function pointArrayEquals(a: Point2D[], b: Point2D[]) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (!pointEquals(a[i], b[i])) return false
  }
  return true
}

/**
 * kd-tree の頂点
 * 
 * この頂点自身がひとつの座標点をもち,
 * left には自身より小さい座標点が, 
 * right には自身より大きい座標点が含まれる  
 * 座標点 Point2D の大小はは頂点の depth によって x,y 座標の大小で比較する
 */
export interface SearchNode extends Point2D {
  depth: number
  left?: SearchNode
  right?: SearchNode
}

type Comparator<T> = (a: T, b: T) => number
const X_COMPARATOR: Comparator<Point2D> = (a, b) => {
  return a.x - b.x
}
const Y_COMPARATOR: Comparator<Point2D> = (a, b) => {
  return a.y - b.y
}

function getComparator(depth: number): Comparator<Point2D> {
  if (depth % 2 === 0) {
    return X_COMPARATOR
  } else {
    return Y_COMPARATOR
  }
}

export enum MeasureType {
  Euclidean,
  Geodesic
}

export function buildTree(points: Point2D[]): SearchNode {
  return buildSubTree(Array.from(points), 0)
}

function buildSubTree(points: Point2D[], depth: number): SearchNode {
  points.sort(getComparator(depth))
  const mid = Math.floor(points.length / 2)
  const p = points[mid]
  const n: SearchNode = {
    x: p.x,
    y: p.y,
    depth: depth
  }
  if (mid > 0) {
    n.left = buildSubTree(points.slice(0, mid), depth + 1)
  }
  if (mid + 1 < points.length) {
    n.right = buildSubTree(points.slice(mid + 1, points.length), depth + 1)
  }
  return n
}

export function releaseTree(root: SearchNode) {
  if (root.left) releaseTree(root.left)
  if (root.right) releaseTree(root.right)
  root.left = undefined
  root.right = undefined
}

export const SPHERE_RADIUS = 6371009.0

export function measure(a: Point2D, b: Point2D, method: MeasureType = MeasureType.Euclidean) {
  if (method === MeasureType.Geodesic) {
    const lng1 = Math.PI * a.x / 180
    const lat1 = Math.PI * a.y / 180
    const lng2 = Math.PI * b.x / 180
    const lat2 = Math.PI * b.y / 180
    const lng = (lng1 - lng2) / 2
    const lat = (lat1 - lat2) / 2
    return SPHERE_RADIUS * 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(lat), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(lng), 2)))
  } else {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
  }
}

