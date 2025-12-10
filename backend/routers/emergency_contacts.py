"""
Emergency contacts router for managing user emergency contacts.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, EmergencyContact
from schemas import EmergencyContactCreate, EmergencyContactUpdate, EmergencyContactResponse
from auth import get_current_user

router = APIRouter()


@router.post("/", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
def create_emergency_contact(
    contact_data: EmergencyContactCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new emergency contact for the current user.

    Args:
        contact_data: Emergency contact data
        current_user: Authenticated user
        db: Database session

    Returns:
        Created emergency contact
    """
    # If is_primary is True, unset other primary contacts
    if contact_data.is_primary:
        db.query(EmergencyContact).filter(
            EmergencyContact.user_id == current_user.id,
            EmergencyContact.is_primary == True
        ).update({"is_primary": False})

    new_contact = EmergencyContact(
        user_id=current_user.id,
        name=contact_data.name,
        phone=contact_data.phone,
        relationship=contact_data.relationship,
        is_primary=contact_data.is_primary
    )

    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)

    return new_contact


@router.get("/", response_model=List[EmergencyContactResponse])
def list_emergency_contacts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all emergency contacts for the current user.

    Args:
        current_user: Authenticated user
        db: Database session

    Returns:
        List of emergency contacts
    """
    contacts = db.query(EmergencyContact).filter(
        EmergencyContact.user_id == current_user.id
    ).order_by(EmergencyContact.is_primary.desc(), EmergencyContact.created_at).all()

    return contacts


@router.get("/{contact_id}", response_model=EmergencyContactResponse)
def get_emergency_contact(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific emergency contact.

    Args:
        contact_id: Emergency contact ID
        current_user: Authenticated user
        db: Database session

    Returns:
        Emergency contact

    Raises:
        HTTPException: If contact not found or doesn't belong to user
    """
    contact = db.query(EmergencyContact).filter(
        EmergencyContact.id == contact_id,
        EmergencyContact.user_id == current_user.id
    ).first()

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency contact not found"
        )

    return contact


@router.put("/{contact_id}", response_model=EmergencyContactResponse)
def update_emergency_contact(
    contact_id: int,
    contact_data: EmergencyContactUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an emergency contact.

    Args:
        contact_id: Emergency contact ID
        contact_data: Updated contact data
        current_user: Authenticated user
        db: Database session

    Returns:
        Updated emergency contact

    Raises:
        HTTPException: If contact not found or doesn't belong to user
    """
    contact = db.query(EmergencyContact).filter(
        EmergencyContact.id == contact_id,
        EmergencyContact.user_id == current_user.id
    ).first()

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency contact not found"
        )

    # If setting as primary, unset other primary contacts
    if contact_data.is_primary:
        db.query(EmergencyContact).filter(
            EmergencyContact.user_id == current_user.id,
            EmergencyContact.id != contact_id,
            EmergencyContact.is_primary == True
        ).update({"is_primary": False})

    # Update fields if provided
    if contact_data.name is not None:
        contact.name = contact_data.name
    if contact_data.phone is not None:
        contact.phone = contact_data.phone
    if contact_data.relationship is not None:
        contact.relationship = contact_data.relationship
    if contact_data.is_primary is not None:
        contact.is_primary = contact_data.is_primary

    db.commit()
    db.refresh(contact)

    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_emergency_contact(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete an emergency contact.

    Args:
        contact_id: Emergency contact ID
        current_user: Authenticated user
        db: Database session

    Raises:
        HTTPException: If contact not found or doesn't belong to user
    """
    contact = db.query(EmergencyContact).filter(
        EmergencyContact.id == contact_id,
        EmergencyContact.user_id == current_user.id
    ).first()

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency contact not found"
        )

    db.delete(contact)
    db.commit()

    return None
