# UniVerge upgrade notes

This package is based on the supplied UniVerge source and upgrades the existing application rather than replacing its design language.

### Functional upgrades
1. Local email/password authentication.
2. Protected assessment submission.
3. Persistent learner progress when MySQL is configured.
4. Adaptive next-level recommendation API.
5. Search ranking over multiple knowledge fields.
6. Grounded AI fallback when no LLM key is configured.
7. Full assessment runner in the student UI.
8. Responsive dashboard with network metrics.
9. Independent deployment path without the Manus Vite runtime.

### Suggested production upgrades
- Add a proper password-salt column and Argon2id/bcrypt for high-security deployments.
- Replace in-memory sessions with a Redis/database session store.
- Add vector embeddings with pgvector/Qdrant/Pinecone.
- Add admin document ingestion and institute permissions.
- Add rate limiting, CSRF protection, audit logs and email verification.
