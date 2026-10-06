hl.monitor({
    output   = "",
    mode     = "preferred",
    position = "auto",
    scale    = "auto",
})

-- laptop screen
hl.monitor({
    output   = "eDP-1",
    mode     = "preferred",
    position = "auto",
    scale    = "1.6",
})

-- external screen (LG TV), placed to the right of the laptop
-- laptop is 1920x1080 at scale 1.6 = 1200 logical px wide
hl.monitor({
    output   = "HDMI-A-1",
    mode     = "preferred",
    position = "auto",
    scale    = "1",
})

local laptop = "eDP-1"
local laptop_workspace = 6

-- send workspaces 1-10 (except the laptop's own) to any external monitor
local function assign(monitor)
    if monitor.name == laptop then return end
    for i = 1, 10 do
        if i ~= laptop_workspace then
            hl.workspace_rule({
                workspace = tostring(i),
                monitor   = monitor.name,
                default   = (i == 1),
            })
        end
    end
end

-- the laptop keeps its own workspace
hl.workspace_rule({
    workspace = tostring(laptop_workspace),
    monitor   = laptop,
    default   = true,
})

-- monitors already connected at startup/reload
for _, m in ipairs(hl.get_monitors()) do
    assign(m)
end

-- monitors plugged in later
hl.on("monitor.added", assign)
