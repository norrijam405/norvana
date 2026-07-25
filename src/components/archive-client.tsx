"use client";

import { motion } from "framer-motion";
import { Footer } from "./footer";

type Volume = {
  id: number;
  volumeNumber: number;
  niche: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  productCount: number;
};

const VOLUME_EMOJIS = ["🏡", "🍳", "🌿", "🎨", "✨"];

export function ArchiveClient({ volumes }: { volumes: Volume[] }) {
  return (
    <>
      <main className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="text-sm text-indigo-accent font-medium tracking-widest uppercase">The Archive</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Past Volumes</h1>
            <p className="text-muted mt-3 max-w-xl">
              Every volume tells a story. Explore past collections and the objects that defined each season.
            </p>
          </div>

          {volumes.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">📚</p>
              <p className="text-muted">No volumes yet. Seed the database to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {volumes.map((volume, i) => (
                <motion.div
                  key={volume.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-surface hover:shadow-lg transition-all duration-500"
                >
                  <div className={`aspect-[4/3] flex items-center justify-center text-7xl bg-gradient-to-br ${
                    volume.isActive
                      ? "from-indigo-accent/10 to-indigo-accent/5"
                      : "from-gray-100 to-gray-50 grayscale group-hover:grayscale-0"
                  } transition-all duration-500`}>
                    {VOLUME_EMOJIS[i] || "📦"}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-indigo-accent font-mono font-semibold">
                        Vol. {volume.volumeNumber}
                      </span>
                      {volume.isActive && (
                        <span className="badge bg-indigo-accent text-white">Active</span>
                      )}
                    </div>
                    <h3 className="font-display text-xl font-semibold">{volume.niche}</h3>
                    <p className="text-sm text-muted mt-2 line-clamp-2">{volume.description}</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <span className="text-xs text-muted">
                        {volume.startDate} → {volume.endDate}
                      </span>
                      <span className="text-xs font-medium text-indigo-accent">
                        {volume.productCount} products
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
