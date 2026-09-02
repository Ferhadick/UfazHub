import argparse
import asyncio
import sys

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models import User, UserRole, UserStatus


async def promote(email: str) -> None:
    async with AsyncSessionLocal() as session:
        user = await session.scalar(select(User).where(User.email == email.lower()))
        if user is None:
            raise SystemExit(f"No user found for {email}")
        user.role = UserRole.admin
        user.status = UserStatus.active
        user.muted_until = None
        await session.commit()
        print(f"promoted {user.username} ({user.email}) to admin")


def main() -> None:
    parser = argparse.ArgumentParser(description="Promote an existing UFAZ Hub user to admin.")
    parser.add_argument("email")
    args = parser.parse_args()
    asyncio.run(promote(args.email))


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(1)
