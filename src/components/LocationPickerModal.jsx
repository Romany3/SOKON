import React, { useEffect, useMemo, useRef, useState } from 'react';

const TILE_SIZE = 256;
const DEFAULT_CENTER = { lat: 27.1828, lng: 31.1828 };

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const latLngToWorld = ({ lat, lng }, zoom) => {
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const scale = TILE_SIZE * (2 ** zoom);

  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
};

const worldToLatLng = ({ x, y }, zoom) => {
  const scale = TILE_SIZE * (2 ** zoom);
  const lng = (x / scale) * 360 - 180;
  const mercator = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(mercator) - Math.exp(-mercator)));

  return { lat, lng };
};

const normalizeLng = (lng) => {
  if (lng > 180) {
    return lng - 360;
  }

  if (lng < -180) {
    return lng + 360;
  }

  return lng;
};

export const LocationPickerModal = ({
  open,
  title = 'Select Apartment Location',
  initialCoordinates,
  onClose,
  onSelect,
}) => {
  const mapRef = useRef(null);
  const [mapSize, setMapSize] = useState({ width: 640, height: 420 });
  const [zoom, setZoom] = useState(15);
  const [center, setCenter] = useState(initialCoordinates || DEFAULT_CENTER);
  const [selected, setSelected] = useState(initialCoordinates || DEFAULT_CENTER);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const nextCoordinates = initialCoordinates || DEFAULT_CENTER;
    setCenter(nextCoordinates);
    setSelected(nextCoordinates);
    setZoom(15);

    const updateSize = () => {
      if (!mapRef.current) {
        return;
      }

      const rect = mapRef.current.getBoundingClientRect();
      setMapSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, [initialCoordinates, open]);

  const tiles = useMemo(() => {
    if (!mapSize.width || !mapSize.height) {
      return [];
    }

    const centerWorld = latLngToWorld(center, zoom);
    const topLeft = {
      x: centerWorld.x - mapSize.width / 2,
      y: centerWorld.y - mapSize.height / 2,
    };
    const startTileX = Math.floor(topLeft.x / TILE_SIZE);
    const startTileY = Math.floor(topLeft.y / TILE_SIZE);
    const endTileX = Math.floor((topLeft.x + mapSize.width) / TILE_SIZE);
    const endTileY = Math.floor((topLeft.y + mapSize.height) / TILE_SIZE);
    const tilesInRow = 2 ** zoom;
    const renderedTiles = [];

    for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
      if (tileY < 0 || tileY >= tilesInRow) {
        continue;
      }

      for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
        const wrappedX = ((tileX % tilesInRow) + tilesInRow) % tilesInRow;
        renderedTiles.push({
          key: `${tileX}:${tileY}`,
          x: tileX,
          y: tileY,
          wrappedX,
          left: tileX * TILE_SIZE - topLeft.x,
          top: tileY * TILE_SIZE - topLeft.y,
        });
      }
    }

    return renderedTiles;
  }, [center, mapSize.height, mapSize.width, zoom]);

  const markerPosition = useMemo(() => {
    if (!mapSize.width || !mapSize.height) {
      return { left: '50%', top: '50%' };
    }

    const centerWorld = latLngToWorld(center, zoom);
    const selectedWorld = latLngToWorld(selected, zoom);
    const topLeft = {
      x: centerWorld.x - mapSize.width / 2,
      y: centerWorld.y - mapSize.height / 2,
    };

    return {
      left: `${selectedWorld.x - topLeft.x}px`,
      top: `${selectedWorld.y - topLeft.y}px`,
    };
  }, [center, mapSize.height, mapSize.width, selected, zoom]);

  if (!open) {
    return null;
  }

  const handleMapClick = (event) => {
    if (!mapRef.current) {
      return;
    }

    const rect = mapRef.current.getBoundingClientRect();
    const centerWorld = latLngToWorld(center, zoom);
    const topLeft = {
      x: centerWorld.x - rect.width / 2,
      y: centerWorld.y - rect.height / 2,
    };
    
    // Support touch events as well
    const clientX = event.clientX || (event.touches && event.touches[0].clientX);
    const clientY = event.clientY || (event.touches && event.touches[0].clientY);

    const worldPoint = {
      x: topLeft.x + (clientX - rect.left),
      y: topLeft.y + (clientY - rect.top),
    };
    const nextCoordinates = worldToLatLng(worldPoint, zoom);
    const normalized = {
      lat: clamp(nextCoordinates.lat, -85, 85),
      lng: normalizeLng(nextCoordinates.lng),
    };

    setCenter(normalized);
    setSelected(normalized);
  };

  const handleGoogleMaps = () => {
    const lat = selected.lat.toFixed(6);
    const lng = selected.lng.toFixed(6);
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank', 'noopener,noreferrer');
  };

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[95vh] overflow-auto custom-scroll rounded-[1rem] border border-white/20 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 bg-white z-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
              Location picker
            </p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">
              Click on the map to place the apartment pin. Coordinates save automatically.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 p-3 text-slate-600 transition hover:bg-slate-200"
            aria-label="Close location picker"
          >
            <i className="fas fa-xmark" />
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="border-b border-slate-100 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between gap-3 px-6 py-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((current) => clamp(current - 1, 10, 19))}
                  className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  <i className="fas fa-minus mr-2"></i>
                  Zoom out
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((current) => clamp(current + 1, 10, 19))}
                  className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Zoom in
                </button>
              </div>

              <button
                type="button"
                onClick={handleGoogleMaps}
                className="rounded-xl bg-[#245999] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#1f4f86]"
              >
                <i className="fa-brands fa-google mr-2"></i>
                Google Maps
              </button>
            </div>

            <div
              ref={mapRef}
              onClick={handleMapClick}
              className="relative h-[420px] w-full cursor-crosshair overflow-hidden bg-slate-200"
            >
              {tiles.map((tile) => (
                <img
                  key={tile.key}
                  src={`https://tile.openstreetmap.org/${zoom}/${tile.wrappedX}/${tile.y}.png`}
                  alt=""
                  className="absolute h-[256px] w-[256px] select-none"
                  style={{
                    left: `${tile.left}px`,
                    top: `${tile.top}px`,
                  }}
                  draggable={false}
                />
              ))}

              <div
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-full"
                style={markerPosition}
              >
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-[#245999] p-3 text-white shadow-xl">
                    <i className="fas fa-location-dot text-lg" />
                  </div>
                  <div className="mt-1 h-4 w-1 rounded-full bg-[#245999]/70" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6 bg-slate-50 p-6">
            <div className="space-y-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Selected coordinates
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Latitude
                    </span>
                    <span className="mt-1 block font-semibold text-slate-900">
                      {selected.lat.toFixed(6)}
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Longitude
                    </span>
                    <span className="mt-1 block font-semibold text-slate-900">
                      {selected.lng.toFixed(6)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Tips</p>
                <ul className="mt-3 space-y-2 leading-6">
                  <li>Zoom in before placing the pin if you need a precise spot.</li>
                  <li>The pin recenters on the point you select.</li>
                  <li>You can still open the exact position in Google Maps.</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
              >
                Use location
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
