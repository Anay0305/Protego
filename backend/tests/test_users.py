"""
Tests for user management endpoints.
"""

import pytest
from fastapi import status


def test_register_user(client, sample_user_data):
    """Test user registration."""
    response = client.post("/api/users/register", json=sample_user_data)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == sample_user_data["name"]
    assert data["phone"] == sample_user_data["phone"]
    assert data["email"] == sample_user_data["email"]
    assert "id" in data


def test_register_duplicate_phone(client, sample_user_data):
    """Test that duplicate phone numbers are rejected."""
    # Register first user
    client.post("/api/users/register", json=sample_user_data)

    # Try to register again with same phone
    response = client.post("/api/users/register", json=sample_user_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_get_user(client, sample_user_data):
    """Test retrieving user by ID."""
    # Create user
    create_response = client.post("/api/users/register", json=sample_user_data)
    user_id = create_response.json()["id"]

    # Get user
    response = client.get(f"/api/users/{user_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == user_id
    assert data["name"] == sample_user_data["name"]


def test_get_nonexistent_user(client):
    """Test getting a user that doesn't exist."""
    response = client.get("/api/users/999")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_update_user(client, sample_user_data):
    """Test updating user information."""
    # Create user
    create_response = client.post("/api/users/register", json=sample_user_data)
    user_id = create_response.json()["id"]

    # Update user
    update_data = {"name": "Jane Doe", "email": "jane@example.com"}
    response = client.put(f"/api/users/{user_id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Jane Doe"
    assert data["email"] == "jane@example.com"


def test_delete_user(client, sample_user_data):
    """Test deleting a user."""
    # Create user
    create_response = client.post("/api/users/register", json=sample_user_data)
    user_id = create_response.json()["id"]

    # Delete user
    response = client.delete(f"/api/users/{user_id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify user is deleted
    get_response = client.get(f"/api/users/{user_id}")
    assert get_response.status_code == status.HTTP_404_NOT_FOUND


def test_list_users(client, sample_user_data):
    """Test listing all users."""
    # Create multiple users
    for i in range(3):
        user_data = sample_user_data.copy()
        user_data["phone"] = f"+123456789{i}"
        user_data["email"] = f"user{i}@example.com"
        client.post("/api/users/register", json=user_data)

    # List users
    response = client.get("/api/users/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 3
