export interface ApplicationVersion {
    game_version: string;
    build_version: number;
    build_mode: string;
    platform: string;
}

export interface FactorioGame {
    game_id: number;
    name: string;
    description: string;
    max_players: number;
    application_version: ApplicationVersion;
    game_time_elapsed: number;
    has_password: boolean;
    server_id: string;
    tags: string[];
    host_address: string;
    headless_server: boolean;
    has_mods: boolean;
    mod_count: number;
}

// Add this to your existing types
export interface TrackedGame {
    game_id: number;
    game_time_elapsed: number;
    last_posted: number;
}

export interface FactorioNotifySubscription {
    id: string;
    guildId: string;
    channelId: string;
    tags: string[];
    nameKeywords: string[];
    descriptionKeywords: string[];
    trackedGames: TrackedGame[];
}