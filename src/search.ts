import { measure, MeasureType, Point2D, SearchNode, SPHERE_RADIUS } from "./tree";

/**
 * 探索結果の座標点
 */
export interface MeasuredPoint extends Point2D {
  /**
   * 探索の中心点からの距離
   */
  dist: number
}

/**
 * kd-tree で最近傍探索  
 * 
 * 距離の計算に関して： Euclidean の場合はx,y座標の値に基づくユークリッド距離
 * Geodesic の場合はx,yを緯度・経度に読み替えて半径 @see SPHERE_RADIUS の球面上の大円距離で計算する
 * @param root 探索するkd-treeの根本
 * @param query この点の近傍点を探索する
 * @param k k番目までに近い点を探索する
 * @param r query からの距離がr以内の近傍点をすべて探索する
 * @param method Euclidean: ユークリッド距離 Geodesic: 球面上の大円距離 で計算する
 * @returns query から近い順にソートされた点のリスト length >= k
 */
export function searchNearest(root: SearchNode, query: Point2D, k: number, r: number = 0, method: MeasureType = MeasureType.Euclidean): MeasuredPoint[] {
  var result: MeasuredPoint[] = []
  var state: EuclideanSearch | GeodesicSearch
  if (method === MeasureType.Euclidean) {
    state = {
      type: MeasureType.Euclidean,
      node: root,
      query: query,
      k: k,
      r: r,
      result: result,
      traverse: 0,
    }
    searchEuclidean(state)
  } else {
    state = {
      type: MeasureType.Geodesic,
      node: root,
      query: query,
      k: k,
      r: r,
      result: result,
      region: {
        north: 90,
        south: -90,
        west: -180,
        east: 180
      },
      traverse: 0
    }
    searchGeodesic(state)
  }
  console.debug(`traverse: ${state.traverse}(k=${k},r=${r})`)
  return result
}


interface SearchStateBase<T> {
  type: T
  node?: SearchNode
  query: Point2D
  k: number
  r: number
  result: MeasuredPoint[],
  traverse: number
}

interface Region {
  north: number
  south: number
  west: number
  east: number
}

type ChildType = "left" | "right"

function invert(type: ChildType): ChildType {
  return type === "left" ? "right" : "left"
}

function getChild(node: SearchNode, which: ChildType): SearchNode | undefined {
  return which === "left" ? node.left : node.right
}

interface EuclideanSearch extends SearchStateBase<MeasureType.Euclidean> { }

interface GeodesicSearch extends SearchStateBase<MeasureType.Geodesic> {
  region: Region
}

function searchEuclidean(state: EuclideanSearch) {
  const node = state.node
  if (!node) return
  state.traverse += 1
  const pos = state.query
  const d = measure(pos, node, state.type)
  insertSearchResult(state, d, node)
  
  const compareX = (node.depth % 2 === 0)
  const threshold = compareX ? node.x : node.y
  const value = compareX ? pos.x : pos.y
  let next = {
    ...state,
    node: value < threshold ? node.left : node.right
  }
  searchEuclidean(next)
  state.traverse = next.traverse

  const dist2th = Math.abs(value - threshold)
  if (dist2th <= Math.max(state.result[state.result.length - 1].dist, state.r)) {
    next = {
      ...state,
      node: value < threshold ? node.right : node.left
    }
    searchEuclidean(next)
    state.traverse = next.traverse
  }
}

function searchGeodesic(state: GeodesicSearch) {
  const node = state.node
  if (!node) return
  state.traverse += 1
  const pos = state.query
  const d = measure(pos, node, state.type)
  insertSearchResult(state, d, node)

  const which = nextWhichChild(pos, state.region, node)
  let region = nextRegion(node, state.region, which)
  let next = {
    ...state,
    node: getChild(node, which),
    region: region
  }
  searchGeodesic(next)
  state.traverse = next.traverse

  const opposite = invert(which)
  region = nextRegion(node, state.region, opposite)
  const dist2th = minDist2Region(pos, region, node)
  if (dist2th <= Math.max(state.result[state.result.length - 1].dist, state.r)) {
    next = {
      ...state,
      node: getChild(node, opposite),
      region: region
    }
    searchGeodesic(next)
    state.traverse = next.traverse
  }
}

function insertSearchResult(state: SearchStateBase<any>, d: number, p: Point2D) {
  const size = state.result.length
  let index = -1
  if (size > 0 && d < state.result[size - 1].dist) {
    index = size - 1
    while (index > 0) {
      if (d >= state.result[index - 1].dist) break
      index -= 1;
    }
  } else if (size < state.k || d <= state.r) {
    index = size
  }
  if (index >= 0) {
    state.result.splice(index, 0, {
      x: p.x,
      y: p.y,
      dist: d
    })
    if (size >= state.k && state.result[size].dist > state.r) {
      state.result.pop()
    }
  }
}


/**
 * ある点と緯線・経線で囲まれた領域中の点との距離の最小値を計算する
 * 
 * @param pos regionの内部にはないこと
 * @param region 
 * @param node 現在の探索ノード
 * @returns 領域中の点との距離の最小値
 */
function minDist2Region(pos: Point2D, region: Region, node: SearchNode): number {
  if (region.west < pos.x && pos.x < region.east &&
    region.south < pos.y && pos.y < region.north) {
    throw Error("pos in the region!")
  }
  if (node.depth % 2 === 0) {
    if (region.west < pos.x && pos.x < region.east) {
      throw Error("pos in the range of longitude!")
    }
    return Math.min(
      dist2lng(pos, region.east, region.south, region.north),
      dist2lng(pos, region.west, region.south, region.north)
    )
  } else {
    if (region.south < pos.y && pos.y < region.north) {
      throw Error("pos in the range of latitude!")
    }
    return Math.min(
      dist2lat(pos, region.north, region.west, region.east),
      dist2lat(pos, region.south, region.west, region.east)
    )
  }
}

/**
 * 経度の差の絶対値 
 * @param lng1 
 * @param lng2 
 * @returns 0 <= diff [deg] <= 180
 */
function absLng(lng1: number, lng2: number): number {
  let lng = lng1 - lng2
  while (lng > 180) lng -= 360
  while (lng < -180) lng += 360
  return Math.abs(lng)
}

function nextWhichChild(pos: Point2D, region: Region, node: SearchNode): ChildType {
  if (node.depth % 2 === 0) {
    if (region.west <= pos.x && pos.x <= region.east) {
      return pos.x < node.x ? "left" : "right"
    } else {
      return absLng(pos.x, region.west) < absLng(pos.x, region.east) ? "left" : "right"
    }
  } else {
    return pos.y < node.y ? "left" : "right"
  }
}

function nextRegion(node: SearchNode, current: Region, which: ChildType): Region {
  const next = {
    ...current
  }
  if (node.depth % 2 === 0) {
    if (which === "left") {
      next.east = node.x
    } else {
      next.west = node.x
    }
  } else {
    if (which === "left") {
      next.north = node.y
    } else {
      next.south = node.y
    }
  }
  return next
}

/**
 * 経線上の線分との距離  
 * @param pos この点からの距離を計算
 * @param longitude 経線の経度
 * @param south, north 線分の端点の緯度 (south < north)
 */
function dist2lng(pos: Point2D, longitude: number, south: number, north: number): number {
  // まず端点との距離
  const dist = [
    measure(pos, { x: longitude, y: south }, MeasureType.Geodesic),
    measure(pos, { x: longitude, y: north }, MeasureType.Geodesic)
  ]
  const d_lng = absLng(pos.x, longitude)
  if (d_lng <= 90) {
    // 経線への垂線の長さ
    const lng = Math.PI * d_lng / 180
    const lat = Math.PI * pos.y / 180
    const h = SPHERE_RADIUS * Math.asin(Math.sin(lng) * Math.cos(lat))
    // 垂線の足の緯度
    const y = 90 - 180 * Math.atan2(Math.cos(lng), Math.tan(lat)) / Math.PI
    if (south < y && y < north) {
      dist.push(h)
    }
  }
  return Math.min(...dist)
}

/**
 * 緯線上の線分との距離  
 * @param pos この点からの距離を計算
 * @param latitude 緯線の緯度
 * @param west, east 線分の端点の経度 (west < east)
 */
function dist2lat(pos: Point2D, latitude: number, west: number, east: number): number {
  // まず端点との距離
  const dist = [
    measure(pos, { x: east, y: latitude }, MeasureType.Geodesic),
    measure(pos, { x: west, y: latitude }, MeasureType.Geodesic)
  ]
  if (west < pos.x && pos.x < east) {
    // 垂線の長さ(=経線の一部)
    const h = SPHERE_RADIUS * Math.PI * Math.abs(pos.y - latitude) / 180
    dist.push(h)
  }
  return Math.min(...dist)
}