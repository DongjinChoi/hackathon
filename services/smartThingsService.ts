const API_URL = 'https://api.smartthings.com/v1/devices/713d6e89-1be0-4a57-a156-5909a6ed40c8/commands';
const AUTH_TOKEN = '879e6644-af8d-498a-a09a-1a77cdcf84b0';

export const controlLight = async (state: 'on' | 'off'): Promise<void> => {
    const body = {
        commands: [
            {
                component: "main",
                capability: "switch",
                command: state,
                arguments: [],
            },
        ],
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            try {
                const errorData = await response.json();
                console.error(`Failed to control light. Status: ${response.status}`, errorData);
            } catch (e) {
                console.error(`Failed to control light. Status: ${response.status}. Could not parse error response.`);
            }
        }
    } catch (error) {
        console.error("Error sending command to SmartThings API:", error);
    }
};

export const getLightStatus = async (): Promise<'on' | 'off' | 'unknown'> => {
    const STATUS_URL = 'https://api.smartthings.com/v1/devices/713d6e89-1be0-4a57-a156-5909a6ed40c8/components/main/capabilities/switch/status';

    try {
        const response = await fetch(STATUS_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
            },
        });

        if (!response.ok) {
            console.error(`Failed to get light status. Status: ${response.status}`);
            return 'unknown';
        }

        const data = await response.json();
        const value = data?.switch?.value;
        if (value === 'on' || value === 'off') {
            return value;
        }

        console.warn(`Unexpected light status value: ${value}`);
        return 'unknown';
    } catch (error) {
        console.error("Error fetching light status from SmartThings API:", error);
        return 'unknown';
    }
};
