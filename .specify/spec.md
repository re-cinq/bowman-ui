# bowman-ui System Specification

## Overview

`bowman-ui` is a presentational React component library that provides reusable UI building blocks for AI chat interfaces. Extracted from an internal application, it serves as a props-driven, dependency-light solution for constructing chat-based user interfaces without bundling authentication, data-fetching, routing, or internationalization concerns.

The library follows a separation-of-concerns pattern where `@re-cinq/bowman-ui` handles presentation and UI composition while consumer applications control data flow, state management, and business logic integration.

## Key Capabilities

- **Message Rendering**: Components for displaying chat messages in various formats and states
- **Message Composer**: UI controls for users to author and send messages
- **Conversation Management**: Components for listing, selecting, and organizing conversations
- **App Shell**: Top-level container components providing chat application layout structure
- **Props-Driven Architecture**: All functionality exposed through React component props, enabling consumer customization without component modification

## Core Data Model

The system operates on a presentation layer without embedded data models. Consumers provide:

- **Message Objects**: Data structures containing message content, metadata (timestamps, sender), and rendering state
- **Conversation Objects**: Collections of messages and conversation metadata
- **Label/Text Strings**: UI labels and messages supplied by consumers for display rendering
- **User Input Callbacks**: Event handlers for composition, message sending, and conversation selection

Components transform supplied props into rendered UI without assumptions about underlying data architecture.

## User Roles

- **Component Consumers**: Development teams integrating `bowman-ui` into chat applications; supply data, configuration, and business logic
- **End Users**: Users interacting with chat interfaces built from `bowman-ui` components; not directly aware of component library

## Business Rules

- Components remain presentation-only; no data persistence, API calls, or authentication handling occurs within the library
- All dynamic text and labels must be provided by consumers; no hardcoded strings except structural UI elements
- Components accept callback functions for user interactions; consumers implement business logic in handlers
- Component library maintains no coupling to specific AI engine implementations or data source systems

## Success Metrics

- Package successfully published to npm registry as `@re-cinq/bowman-ui`
- Zero external dependencies for authentication, HTTP, routing, or i18n
- All core chat UI components (message rendering, composer, conversation list, app shell) implemented and documented
- Consumers able to integrate library components with minimal glue code for basic chat interfaces
- Component props fully typed and documented; TypeScript support functional
- Build contract established and verified across target environments

## Current Status

Repository is in bootstrap phase. Package skeleton, build contract, and component implementations are being delivered through E3 epic issues. Core components are not yet finalized in the codebase.