import type { StyleSpecification } from 'mapbox-gl'

/**
 * "Avocado" — the Snazzy Maps style the Figma comps were mocked with, ported
 * from its Google Maps style array to the Mapbox GL style spec.
 *
 *   landscape geometry.fill  #abce83      -> background
 *   water     geometry       #aee2e0      -> water fill + waterway line
 *   road.highway geometry    #EBF4A4      -> motorway / trunk / primary
 *   road.arterial, road.local  visibility off
 *   all labels, poi, transit, administrative  visibility off
 *
 * The first rule in the source array is `featureType: all / elementType: labels
 * / visibility: off`, so this style deliberately declares **no symbol layers at
 * all**. The only text over the map comes from our own HTML markers.
 */

const LAND = '#ABCE83'
const WATER = '#AEE2E0'
const ROAD = '#EBF4A4'

export const avocadoStyle: StyleSpecification = {
  version: 8,
  name: 'Avocado',
  glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
  projection: { name: 'mercator' },
  sources: {
    composite: {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': LAND },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'composite',
      'source-layer': 'water',
      paint: { 'fill-color': WATER },
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'composite',
      'source-layer': 'waterway',
      minzoom: 8,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': WATER,
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.6, 12, 1.8, 16, 5],
      },
    },
    // road.arterial / road.local are "off" in the source style, but the comps
    // show a pale road mesh once you zoom in on the Kangaroo Farm — so the
    // smaller classes are held back to the deep zoom levels rather than cut.
    {
      id: 'road-street',
      type: 'line',
      source: 'composite',
      'source-layer': 'road',
      minzoom: 12,
      filter: ['all', ['==', ['geometry-type'], 'LineString'], ['match', ['get', 'class'], ['street', 'street_limited', 'track'], true, false]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ROAD,
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.6, 14, 2, 17, 8],
      },
    },
    {
      id: 'road-secondary',
      type: 'line',
      source: 'composite',
      'source-layer': 'road',
      minzoom: 11,
      filter: ['all', ['==', ['geometry-type'], 'LineString'], ['match', ['get', 'class'], ['secondary', 'tertiary'], true, false]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ROAD,
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.5, 13, 1.8, 16, 6],
      },
    },
    {
      id: 'road-primary',
      type: 'line',
      source: 'composite',
      'source-layer': 'road',
      minzoom: 9,
      filter: ['all', ['==', ['geometry-type'], 'LineString'], ['==', ['get', 'class'], 'primary']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ROAD,
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.7, 12, 2.2, 14, 4.5, 16, 10],
      },
    },
    {
      id: 'road-motorway',
      type: 'line',
      source: 'composite',
      'source-layer': 'road',
      filter: [
        'all',
        ['==', ['geometry-type'], 'LineString'],
        ['match', ['get', 'class'], ['motorway', 'trunk', 'motorway_link', 'trunk_link'], true, false],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ROAD,
        'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 8, 1.4, 11, 3.4, 14, 8, 16, 15],
      },
    },
  ],
}
