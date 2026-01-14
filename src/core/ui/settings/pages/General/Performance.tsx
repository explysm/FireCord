import { React, NavigationNative } from "@metro/common";
import { ScrollView, View } from "react-native";
import { 
    TableRowGroup, 
    TableRow, 
    Text, 
    Card, 
    Stack,
    TableRowIcon
} from "@metro/common/components";
import { findAssetId } from "@lib/api/assets";
import { pluginStartTimes, registeredPlugins } from "@lib/addons/plugins";
import { useProxy } from "@core/vendetta/storage";

export default function Performance() {
    const sortedPlugins = Array.from(pluginStartTimes.entries())
        .sort((a, b) => b[1] - a[1]);

    const totalTime = Array.from(pluginStartTimes.values()).reduce((a, b) => a + b, 0);

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack spacing={24} style={{ padding: 12 }}>
                <Card style={{ padding: 16, alignItems: 'center', backgroundColor: 'rgba(114, 137, 218, 0.1)' }}>
                    <Text variant="heading-xl/bold" color="text-brand">{totalTime.toFixed(2)}ms</Text>
                    <Text variant="text-sm/medium" color="text-muted">Total Plugin Load Time</Text>
                </Card>

                <TableRowGroup title="Plugin Impact">
                    {sortedPlugins.map(([id, time]) => {
                        const manifest = registeredPlugins.get(id);
                        const name = manifest?.display?.name || id;
                        
                        // Color coding based on impact
                        let timeColor = "text-normal";
                        if (time > 100) timeColor = "#EF4444"; // Red for > 100ms
                        else if (time > 50) timeColor = "#F59E0B"; // Orange for > 50ms
                        else if (time > 10) timeColor = "#4ADE80"; // Green for < 10ms

                        return (
                            <TableRow 
                                key={id}
                                label={name}
                                subLabel={id}
                                icon={<TableRowIcon source={findAssetId(manifest?.vendetta?.icon || "ActivitiesIcon")} />}
                                trailing={
                                    <Text style={{ color: timeColor, fontWeight: 'bold' }}>
                                        {time.toFixed(2)}ms
                                    </Text>
                                }
                            />
                        );
                    })}
                </TableRowGroup>
                
                {sortedPlugins.length === 0 && (
                    <Text variant="text-md/medium" color="text-muted" style={{ textAlign: 'center', marginTop: 20 }}>
                        No plugin performance data available.
                    </Text>
                )}
            </Stack>
        </ScrollView>
    );
}
