import { showLoadingState, hideLoadingState, updateProfileUI, showError } from './ui.js';

const GRAPHQL_ENDPOINT = 'https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql';

export async function fetchUserProfile() {
    if (!window.authToken) return;
    
    showLoadingState();

    const query = `{
        user {
            id
            login
            attrs
            email
            auditRatio
            transactions(where: {_and: [{eventId: {_eq: 75}}]}, order_by: {createdAt: asc}) {
                object {
                    name
                    attrs
                    type
                }
                amount
                createdAt
                eventId
                path
                type
            }
            audits(
                order_by: {createdAt: desc}
                where: {closedAt: {_is_null: true}, group: {captain: {canAccessPlatform: {_eq: true}}}}
            ) {
                closedAt
                group {
                    captainLogin
                    path
                    members {
                        userLogin
                    }
                }
                private {
                    code
                }
            }
            events(where: {eventId: {_eq: 75}}) {
                level
            }
            progresses(where: {eventId: {_eq: 75}} order_by: {createdAt: desc}) {
                grade
                path
                createdAt
                updatedAt
            }
        }
        event(where: {path: {_eq: "/kisumu/module"}}) {
            startAt
            endAt
        }
        goItems: object(
            where: {_or: [{type: {_eq: "project"}, attrs: {_contains: {language: "Go"}}}, {type: {_eq: "piscine"}, name: {_ilike: "%Go%"}}]}
            distinct_on: [name]
        ) {
            name
            type
        }
        jsItems: object(
            where: {_or: [{type: {_eq: "project"}, attrs: {_contains: {language: "JavaScript"}}}, {type: {_eq: "piscine"}, name: {_ilike: "%JS%"}}]}
            distinct_on: [name]
        ) {
            name
            type
        }
        rustItems: object(
            where: {_or: [{type: {_eq: "project"}, attrs: {_contains: {language: "rust"}}}, {type: {_eq: "piscine"}, name: {_ilike: "%Rust%"}}]}
            distinct_on: [name]
        ) {
            name
            type
        }
        skill_types: user {
            transactions_aggregate(
                distinct_on: [type]
                where: {type: {_nin: ["xp", "level", "up", "down"]}}
                order_by: [{type: asc}, {amount: desc}]
            ) {
                nodes {
                    type
                    amount
                }
            }
        }
    }`;

    try {
        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile data');
        }

        const data = await response.json();
        updateProfileUI(data.data);

    } catch (error) {
        console.error('Profile fetch error:', error);
        showError('Failed to load profile data');
    } finally {
        hideLoadingState();
    }
}

export async function refreshData() {
    if (!window.authToken) return;

    const refreshButtons = document.querySelectorAll('#refresh-xp, #refresh-projects');

    try {
        // Show loading state
        refreshButtons.forEach(btn => {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;
        });

        await fetchUserProfile();

    } catch (error) {
        console.error('Refresh failed:', error);
        showError('Failed to refresh data');
    } finally {
        // Restore button state
        refreshButtons.forEach(btn => {
            btn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            btn.disabled = false;
        });
    }
}