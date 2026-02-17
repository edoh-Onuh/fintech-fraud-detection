"""
Authentication and Authorization
Implements role-based access control (RBAC)
"""
from typing import Dict, List, Optional, Set, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from passlib.context import CryptContext
import logging

logger = logging.getLogger(__name__)


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@dataclass
class User:
    """User model"""
    user_id: str
    username: str
    email: str
    hashed_password: str
    roles: List[str] = field(default_factory=list)
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime = field(default_factory=datetime.now)
    last_login: Optional[datetime] = None
    failed_login_attempts: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def has_role(self, role: str) -> bool:
        """Check if user has a specific role"""
        return role in self.roles
    
    def has_any_role(self, roles: List[str]) -> bool:
        """Check if user has any of the specified roles"""
        return any(role in self.roles for role in roles)
    
    def add_role(self, role: str) -> None:
        """Add a role to user"""
        if role not in self.roles:
            self.roles.append(role)
    
    def remove_role(self, role: str) -> None:
        """Remove a role from user"""
        if role in self.roles:
            self.roles.remove(role)


@dataclass
class Permission:
    """Permission model"""
    name: str
    resource: str
    action: str  # 'read', 'write', 'delete', 'execute'
    description: Optional[str] = None


@dataclass
class Role:
    """Role model with permissions"""
    name: str
    description: str
    permissions: Set[str] = field(default_factory=set)
    
    def has_permission(self, permission: str) -> bool:
        """Check if role has a permission"""
        return permission in self.permissions
    
    def add_permission(self, permission: str) -> None:
        """Add permission to role"""
        self.permissions.add(permission)
    
    def remove_permission(self, permission: str) -> None:
        """Remove permission from role"""
        self.permissions.discard(permission)


class AuthenticationManager:
    """
    Manages user authentication
    
    Features:
    - Password hashing with bcrypt
    - Login attempt tracking
    - Account lockout protection
    - Session management
    """
    
    def __init__(
        self,
        max_failed_attempts: int = 5,
        lockout_duration_minutes: int = 30
    ):
        self.users: Dict[str, User] = {}
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.max_failed_attempts = max_failed_attempts
        self.lockout_duration = timedelta(minutes=lockout_duration_minutes)
        
        logger.info("Authentication manager initialized")
    
    def register_user(
        self,
        user_id: str,
        username: str,
        email: str,
        password: str,
        roles: Optional[List[str]] = None
    ) -> User:
        """
        Register a new user
        
        Args:
            user_id: Unique user identifier
            username: Username
            email: Email address
            password: Plain text password (will be hashed)
            roles: Initial roles to assign
            
        Returns:
            Created User object
        """
        if user_id in self.users:
            raise ValueError(f"User {user_id} already exists")
        
        hashed_password = pwd_context.hash(password)
        
        user = User(
            user_id=user_id,
            username=username,
            email=email,
            hashed_password=hashed_password,
            roles=roles or []
        )
        
        self.users[user_id] = user
        logger.info(f"Registered user: {username} ({user_id})")
        
        return user
    
    def authenticate(
        self,
        username: str,
        password: str
    ) -> Optional[User]:
        """
        Authenticate a user
        
        Args:
            username: Username or email
            password: Plain text password
            
        Returns:
            User object if authentication successful, None otherwise
        """
        # Find user by username or email
        user = None
        for u in self.users.values():
            if u.username == username or u.email == username:
                user = u
                break
        
        if not user:
            logger.warning(f"Authentication failed: user not found - {username}")
            return None
        
        # Check if account is locked
        if user.failed_login_attempts >= self.max_failed_attempts:
            # Check if lockout period has passed
            if user.last_login:
                time_since_last = datetime.now() - user.last_login
                if time_since_last < self.lockout_duration:
                    logger.warning(f"Account locked: {username}")
                    return None
                else:
                    # Reset failed attempts after lockout period
                    user.failed_login_attempts = 0
        
        # Verify password
        if not pwd_context.verify(password, user.hashed_password):
            user.failed_login_attempts += 1
            logger.warning(
                f"Authentication failed: invalid password - {username} "
                f"(attempts: {user.failed_login_attempts})"
            )
            return None
        
        # Check if user is active
        if not user.is_active:
            logger.warning(f"Authentication failed: user inactive - {username}")
            return None
        
        # Successful authentication
        user.failed_login_attempts = 0
        user.last_login = datetime.now()
        
        logger.info(f"User authenticated: {username}")
        
        return user
    
    def create_session(
        self,
        user: User,
        session_duration_hours: int = 24
    ) -> str:
        """
        Create a session for authenticated user
        
        Returns:
            Session ID
        """
        import secrets
        
        session_id = secrets.token_urlsafe(32)
        
        self.sessions[session_id] = {
            'user_id': user.user_id,
            'created_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(hours=session_duration_hours),
            'user': user
        }
        
        logger.info(f"Created session for user: {user.username}")
        
        return session_id
    
    def validate_session(self, session_id: str) -> Optional[User]:
        """
        Validate a session
        
        Returns:
            User if session valid, None otherwise
        """
        session = self.sessions.get(session_id)
        
        if not session:
            return None
        
        if datetime.now() > session['expires_at']:
            del self.sessions[session_id]
            logger.info(f"Session expired: {session_id[:8]}...")
            return None
        
        return session['user']
    
    def revoke_session(self, session_id: str) -> bool:
        """
        Revoke a session (logout)
        
        Returns:
            True if revoked, False if not found
        """
        if session_id in self.sessions:
            user_id = self.sessions[session_id]['user_id']
            del self.sessions[session_id]
            logger.info(f"Revoked session for user: {user_id}")
            return True
        
        return False
    
    def change_password(
        self,
        user_id: str,
        old_password: str,
        new_password: str
    ) -> bool:
        """
        Change user password
        
        Returns:
            True if changed, False if old password incorrect
        """
        user = self.users.get(user_id)
        
        if not user:
            return False
        
        if not pwd_context.verify(old_password, user.hashed_password):
            logger.warning(f"Password change failed: incorrect old password - {user_id}")
            return False
        
        user.hashed_password = pwd_context.hash(new_password)
        logger.info(f"Password changed for user: {user.username}")
        
        return True
    
    def reset_password(self, user_id: str, new_password: str) -> bool:
        """
        Reset password (admin function)
        
        Returns:
            True if reset successful
        """
        user = self.users.get(user_id)
        
        if not user:
            return False
        
        user.hashed_password = pwd_context.hash(new_password)
        user.failed_login_attempts = 0
        logger.info(f"Password reset for user: {user.username}")
        
        return True


class AuthorizationManager:
    """
    Manages authorization and role-based access control
    
    Features:
    - Role management
    - Permission management
    - Access control checks
    """
    
    def __init__(self):
        self.roles: Dict[str, Role] = {}
        self.permissions: Dict[str, Permission] = {}
        
        # Initialize default roles
        self._initialize_default_roles()
        
        logger.info("Authorization manager initialized")
    
    def _initialize_default_roles(self) -> None:
        """Initialize default roles and permissions"""
        # Admin role
        admin_role = Role(
            name="admin",
            description="Full system access"
        )
        admin_role.permissions = {
            "fraud_detection:read",
            "fraud_detection:write",
            "fraud_detection:execute",
            "users:read",
            "users:write",
            "users:delete",
            "models:read",
            "models:write",
            "models:deploy",
            "reports:read",
            "reports:generate",
            "config:read",
            "config:write"
        }
        self.roles["admin"] = admin_role
        
        # Analyst role
        analyst_role = Role(
            name="analyst",
            description="Data analysis and reporting"
        )
        analyst_role.permissions = {
            "fraud_detection:read",
            "fraud_detection:execute",
            "reports:read",
            "reports:generate",
            "models:read"
        }
        self.roles["analyst"] = analyst_role
        
        # Operator role
        operator_role = Role(
            name="operator",
            description="System operations"
        )
        operator_role.permissions = {
            "fraud_detection:read",
            "fraud_detection:execute",
            "models:read"
        }
        self.roles["operator"] = operator_role
        
        # Viewer role
        viewer_role = Role(
            name="viewer",
            description="Read-only access"
        )
        viewer_role.permissions = {
            "fraud_detection:read",
            "reports:read"
        }
        self.roles["viewer"] = viewer_role
    
    def create_role(
        self,
        name: str,
        description: str,
        permissions: Optional[Set[str]] = None
    ) -> Role:
        """Create a new role"""
        if name in self.roles:
            raise ValueError(f"Role {name} already exists")
        
        role = Role(
            name=name,
            description=description,
            permissions=permissions or set()
        )
        
        self.roles[name] = role
        logger.info(f"Created role: {name}")
        
        return role
    
    def check_permission(
        self,
        user: User,
        resource: str,
        action: str
    ) -> bool:
        """
        Check if user has permission to perform action on resource
        
        Args:
            user: User to check
            resource: Resource name (e.g., 'fraud_detection')
            action: Action name (e.g., 'read', 'write', 'execute')
            
        Returns:
            True if authorized, False otherwise
        """
        permission = f"{resource}:{action}"
        
        # Check each role the user has
        for role_name in user.roles:
            role = self.roles.get(role_name)
            if role and role.has_permission(permission):
                return True
        
        logger.warning(
            f"Permission denied: {user.username} - {permission}"
        )
        
        return False
    
    def get_user_permissions(self, user: User) -> Set[str]:
        """Get all permissions for a user"""
        permissions = set()
        
        for role_name in user.roles:
            role = self.roles.get(role_name)
            if role:
                permissions.update(role.permissions)
        
        return permissions
    
    def require_permission(self, resource: str, action: str):
        """
        Decorator to enforce permission checks
        
        Example:
            @require_permission('fraud_detection', 'execute')
            def detect_fraud(transaction):
                ...
        """
        def decorator(func):
            def wrapper(user: User, *args, **kwargs):
                if not self.check_permission(user, resource, action):
                    raise PermissionError(
                        f"User {user.username} lacks permission: {resource}:{action}"
                    )
                return func(user, *args, **kwargs)
            return wrapper
        return decorator
